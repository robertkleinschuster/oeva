import {feedDb} from "../db/FeedDb";
import {stoppedStatuses, TransitFeedStatus} from "../db/Feed";
import {FeedImporter} from "./FeedImporter";
import {GTFSDB} from "../db/GTFSDB";
import axios from "axios";
import {scheduleDB} from "../db/ScheduleDB";

export class FeedRunner {
    running: number | undefined

    async run() {
        if (this.running === undefined) {
            try {
                const feed = await feedDb.transit
                    .where('status')
                    .noneOf(stoppedStatuses)
                    .first()
                if (feed) {
                    this.running = feed.id
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
