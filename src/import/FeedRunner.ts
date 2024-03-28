import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import {FeedImporter} from "./FeedImporter.ts";
import {transitDB} from "../db/TransitDB.ts";
import axios from "axios";
import {scheduleDB} from "../db/ScheduleDB.ts";

class FeedRunner {
    running: number | undefined

    async run() {
        if (this.running === undefined) {
            const feed = await feedDb.transit
                .where('status')
                .noneOf([TransitFeedStatus.ERROR, TransitFeedStatus.DONE])
                .first()
            if (feed) {
                this.running = feed.id
                self.postMessage(feed.id)
                try {
                    const dataImporter = new FeedImporter(feedDb, transitDB, scheduleDB, axios)
                    await dataImporter.run(feed.id!)
                } catch (error) {
                    console.error(error)
                    await feedDb.transit.update(feed.id!, {
                        status: TransitFeedStatus.ERROR,
                        progress: String(error)
                    });
                }
                this.running = undefined
                self.postMessage(undefined)
            }
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
