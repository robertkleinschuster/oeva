import {feedDb} from "../../shared/db/FeedDb";
import {stoppedStatuses, TransitFeedStatus} from "../../shared/db/Feed";
import {subDays} from "date-fns";
import ImportWorker from "../../worker/import.ts?worker"

export class FeedRunner {
    running: number | undefined
    onRun: undefined | ((id: number, progress: string) => void) = undefined
    onFinished: undefined | (() => void) = undefined
    private audio: HTMLAudioElement | undefined
    worker = new ImportWorker()
    async check() {
        const date = subDays(new Date(), 7)
        return feedDb.transit
            .where('last_start')
            .below(date.getTime())
            .count()
    }

    progress(progres: string) {
        if (this.onRun && this.running) {
            this.onRun(this.running, progres)
        }
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
                        this.progress('wird gestartet...')
                        try {
                          await this.runInWorker(feed.id!)
                        } catch (error) {
                            console.error(error)
                            this.progress(String(error))
                            await feedDb.transit.update(feed.id!, {
                                status: TransitFeedStatus.ERROR,
                                previous_status: feed.status
                            });
                            await feedDb.log.add({feed_id: feed.id!, message: String(error)})
                        }
                    }

                    clearInterval(interval)
                }
            } catch (e) {
                console.error(e)
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
            if (this.onFinished) {
                this.onFinished()
            }
            return new Promise<void>(resolve => {
                setTimeout(async () => {
                    await this.run()
                    resolve()
                }, 5000)
            })
        }
    }


    runInWorker(feedId: number)
    {
        return new Promise<void>((resolve, reject) => {
            this.worker.postMessage({runFeedId:feedId})
            const listener = (e: MessageEvent) => {
                if (e.data.progress) {
                    this.progress(e.data.progress)
                }
                if (e.data.done) {
                    this.worker.removeEventListener('message', listener)
                    resolve()
                }
                if (e.data.error) {
                    this.worker.removeEventListener('message', listener)
                    reject(e.data.error)
                }
            }
            this.worker.addEventListener('message', listener)
        })
    }

    backgroundExec() {
        if (this.audio && this.audio.paused) {
            void this.audio.play()
            return;
        }
        // unlock audio context
        const ctx = new AudioContext();

        // create silent sound
        const bufferSize = 2 * ctx.sampleRate,
            emptyBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate),
            output = emptyBuffer.getChannelData(0);

        // fill buffer
        for (let i = 0; i < bufferSize; i++)
            output[i] = 0;
        // create source node
        const source = ctx.createBufferSource();
        source.buffer = emptyBuffer;
        source.loop = true;

        // create destination node
        const node = ctx.createMediaStreamDestination();
        source.connect(node);

        // dummy audio element
        const audio = document.createElement("audio");
        audio.style.display = "none";
        document.body.appendChild(audio);

        // set source and play
        audio.srcObject = node.stream;
        this.audio = audio
        void audio.play();
        // background exec enabled
    }
}
