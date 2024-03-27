import {feedDb} from "../db/FeedDb.ts";
import {TransitFeedStatus} from "../db/Feed.ts";
import {FeedImporter} from "./FeedImporter.ts";
import {transitDB} from "../db/TransitDB.ts";
import axios from "axios";

export class FeedRunner {
    static running: number | undefined

    run() {
        feedDb.transit.where('status')
            .noneOf([TransitFeedStatus.ERROR, TransitFeedStatus.DONE])
            .each(async feed => {
                if (FeedRunner.running === undefined) {
                    FeedRunner.running = feed.id
                    console.log('running', FeedRunner.running)
                    try {
                        const dataImporter = new FeedImporter(feedDb, transitDB, axios)
                        await dataImporter.run(feed.id!)
                    } catch (error) {
                        console.error(error)
                        feedDb.transit.update(feed.id!, {
                            status: TransitFeedStatus.ERROR,
                            progress: error
                        });
                    }
                    FeedRunner.running = undefined
                }
            })
    }
}