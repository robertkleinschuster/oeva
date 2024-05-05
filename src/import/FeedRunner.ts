import {feedDb} from "../db/FeedDb";
import {stoppedStatuses, TransitFeedStatus} from "../db/Feed";
import {FeedImporter} from "./FeedImporter";
import {GTFSDB} from "../db/GTFSDB";
import axios from "axios";
import {scheduleDB} from "../db/ScheduleDB";
import {subDays} from "date-fns";

export class FeedRunner {
    running: number | undefined
    onRun: undefined | ((id: number) => void) = undefined
    private audio: HTMLAudioElement | undefined

    async check() {
        const date = subDays(new Date(), 7)
        return feedDb.transit
            .where('last_start')
            .below(date.getTime())
            .count()
    }

    async run() {
        if (this.running === undefined) {
            try {
                const feeds = await feedDb.transit
                    .where('status')
                    .noneOf(stoppedStatuses)
                    .toArray()
                if (feeds.length) {
                    const interval = setInterval(() => {
                        this.backgroundExec();
                    }, 500)

                    for (const feed of feeds) {
                        this.running = feed.id
                        if (this.onRun && feed.id) {
                            this.onRun(feed.id)
                        }
                        try {
                            const dataImporter = new FeedImporter(feedDb, new GTFSDB(feed.id!), scheduleDB, axios)
                            await dataImporter.run(feed.id!)
                        } catch (error) {
                            console.error(error)
                            await feedDb.transit.update(feed.id!, {
                                status: TransitFeedStatus.ERROR,
                                previous_status: feed.status,
                                progress: String(error)
                            });
                        }
                    }

                    clearInterval(interval)
                }
            } catch (e) {
                console.log(e)
            }
        }
        if (this.running) {
            this.running = undefined
            return new Promise<void>(resolve => {
                setTimeout(async () => {
                    await this.run()
                    resolve()
                }, 10)
            })
        } else {
            this.audio?.pause()
            return new Promise<void>(resolve => {
                setTimeout(async () => {
                    await this.run()
                    resolve()
                }, 5000)
            })
        }
    }


    backgroundExec() {
        if (this.audio && this.audio.paused) {
            void this.audio.play()
            return;
        }
        // unlock audio context
        let ctx = new AudioContext();

        // create silent sound
        let bufferSize = 2 * ctx.sampleRate,
            emptyBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
            output = emptyBuffer.getChannelData(0);

        // fill buffer
        for (let i = 0; i < bufferSize; i++)
            output[i] = 0;
        // create source node
        let source = ctx.createBufferSource();
        source.buffer = emptyBuffer;
        source.loop = true;

        // create destination node
        let node = ctx.createMediaStreamDestination();
        source.connect(node);

        // dummy audio element
        let audio = document.createElement("audio");
        audio.style.display = "none";
        document.body.appendChild(audio);

        // set source and play
        audio.srcObject = node.stream;
        this.audio = audio
        void audio.play();
        // background exec enabled
    }
}
