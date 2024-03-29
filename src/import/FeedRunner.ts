import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import {FeedImporter} from "./FeedImporter.ts";
import {GTFSDB} from "../db/GTFSDB.ts";
import axios from "axios";
import {scheduleDB} from "../db/ScheduleDB.ts";

class FeedRunner {
    running: number | undefined

    async run() {
        if (!feedDb.isOpen()) {
            await feedDb.open()
        }
        if (this.running === undefined) {
            try {
                const feed = await feedDb.transit
                    .where('status')
                    .noneOf([TransitFeedStatus.ERROR, TransitFeedStatus.DONE])
                    .first()
                if (feed) {
                    this.running = feed.id
                    self.postMessage(feed.id)
                    try {
                        const dataImporter = new FeedImporter(feedDb, new GTFSDB(feed.id!), scheduleDB, axios)
                        await dataImporter.run(feed.id!)
                    } catch (error) {
                        console.error(error)
                        await feedDb.transit.update(feed.id!, {
                            status: TransitFeedStatus.ERROR,
                            progress: String(error)
                        });
                    }
                }
            } catch (e) {
                console.log(e)
            }
            self.postMessage(undefined)
            this.running = undefined
        }

        return new Promise<void>(resolve => {
            setTimeout(async ()=> {
                await this.run()
                resolve()
            }, 1000)
        })
    }
}

self.onmessage = (e) => {
    if (e.data === 'run') {
        const runner = new FeedRunner()
        void runner.run()
    }
}
