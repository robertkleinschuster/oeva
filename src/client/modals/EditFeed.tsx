import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
    useIonLoading,
} from '@ionic/react';
import React, {useEffect, useRef, useState} from "react";
import FeedForm from "../components/FeedForm";
import {feedDb} from "../../shared/db/FeedDb";
import {useLiveQuery} from "dexie-react-hooks";
import {stoppedStatuses, TransitFeedStatus} from "../../shared/db/Feed";
import {db} from "../db/client";
import {writeFile} from "../fs/StorageManager";


const EditFeed: React.FC<{ feedId: number, trigger: string }> = ({feedId, trigger}) => {
    const [presentLoading, dismissLoading] = useIonLoading();

    const feed = useLiveQuery(() => feedDb.transit.get(feedId), [feedId])

    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [file, setFile] = useState<File>()
    const [keywords, setKeywords] = useState<string | undefined>('')
    const logs = useLiveQuery(() => feedDb.log.where({feed_id: feedId}).limit(100).toArray())

    const modal = useRef<HTMLIonModalElement>(null)

    useEffect(() => {
        if (feed) {
            setName(feed.name)
            setURL(feed.url)
            setKeywords(feed.keywords)
        }
    }, [feed]);

    const saveFeed = async () => {
        await feedDb.transit.update(feed!, {
            name,
            url,
            keywords
        })

        if (file) {
            await writeFile('feeds', new File([file], feedId + '.zip'))
            await feedDb.transit.update(feedId, {status: TransitFeedStatus.EXTRACTING})
        } else if (feed?.id && (name !== feed?.name || keywords !== feed?.keywords)) {
            if (stoppedStatuses.includes(feed.status)) {
                await feedDb.transit.update(feed!, {
                    status: TransitFeedStatus.IMPORTING
                })
            }
        }
    }

    const deleteFeed = async () => {
        await feedDb.log.where({feed_id: feed!.id}).delete()
        await deleteFeedData()
        await deleteFeedDownload()
        await modal.current?.dismiss()
        await feedDb.transit.delete(feed!.id!)
    }

    const deleteFeedData = async () => {
        await presentLoading('Löschen...')
        await db.deleteFrom('service').where("feed_id", '=', feedId).execute()
        await feedDb.transit.update(feed!, {
            previous_status: TransitFeedStatus.IMPORTING,
            status: TransitFeedStatus.ABORTED,
        })
        await dismissLoading()
    }

    const deleteFeedDownload = async () => {
        await presentLoading('Löschen...')
        await feedDb.transit.update(feed!, {
            previous_status: TransitFeedStatus.EXTRACTING,
            status: TransitFeedStatus.ABORTED,
        })
        await dismissLoading()
    }

    const downloadFeed = async () => {
        await saveFeed()
        await feedDb.log.where({feed_id: feed!.id}).delete()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.DOWNLOADING,
        })
        modal.current?.dismiss()
    }
    const importFeed = async () => {
        await saveFeed()
        await feedDb.log.where({feed_id: feed!.id}).delete()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.IMPORTING,
        })
        modal.current?.dismiss()
    }
    const processFeedKeywords = async () => {
        await saveFeed()
        await feedDb.log.where({feed_id: feed!.id}).delete()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.IMPORTING,
        })
        modal.current?.dismiss()
    }

    const continueFeed = async () => {
        if (feed!.previous_status) {
            await saveFeed()
            await feedDb.transit.update(feed!, {
                status: feed!.previous_status
            })
            modal.current?.dismiss()
        }
    }

    const abortFeed = async () => {
        await saveFeed()
        await feedDb.transit.update(feed!, {
            status: TransitFeedStatus.ABORTED,
            previous_status: feed!.status
        })
        modal.current?.dismiss()
        window.location.reload()
    }

    const validateFeed = () => {
        return Boolean(name.length && (url.length || file || feed?.status === TransitFeedStatus.DONE));
    }

    const onChange = async (name: string, url: string, keywords: string, file?: File) => {
        setName(name)
        setURL(url)
        setKeywords(keywords)
        setFile(file)
    }

    return (
        <IonModal ref={modal} trigger={trigger}>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => modal.current?.dismiss()}>Abbrechen</IonButton>
                    </IonButtons>
                    <IonTitle>Feed bearbeiten</IonTitle>
                    <IonButtons slot="end">
                        <IonButton
                            onClick={() => {
                                if (validateFeed()) {
                                    void saveFeed()
                                    modal.current?.dismiss()
                                }
                            }}
                        >
                            Speichern
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <FeedForm disabled={feed && !stoppedStatuses.includes(feed.status)} onChange={onChange} name={name}
                          url={url} keywords={keywords}/>
                <IonList>
                    {feed && stoppedStatuses.includes(feed.status) ?
                        <>
                            <IonItem>
                                {feed.url ?
                                    <IonButton color="primary"
                                               onClick={downloadFeed}>
                                        Herunterladen
                                    </IonButton> : null}
                                <IonButton color="primary"
                                           onClick={importFeed}>
                                    Importieren
                                </IonButton>
                                {feed?.status !== TransitFeedStatus.DONE
                                && feed?.previous_status && !stoppedStatuses.includes(feed.previous_status) ?
                                    <IonButton color="primary"
                                               onClick={continueFeed}>
                                        Fortsetzen ({feed.previous_status})
                                    </IonButton> : null}
                            </IonItem>
                            <IonItem>
                                <IonButton color="primary"
                                           onClick={processFeedKeywords}>
                                    Schnellimport
                                </IonButton>
                            </IonItem>
                            <IonItem>
                                <IonButton color="danger"
                                           onClick={deleteFeed}>
                                    Entfernen
                                </IonButton>
                                <IonButton color="danger"
                                           onClick={deleteFeedDownload}>
                                    Download löschen
                                </IonButton>
                                <IonButton color="danger"
                                           onClick={deleteFeedData}>
                                    Daten löschen
                                </IonButton>
                            </IonItem>
                        </>
                        : null
                    }
                    <IonItem>
                        {feed?.status && !stoppedStatuses.includes(feed?.status) ?
                            <IonButton color="warning"
                                       onClick={abortFeed}>
                                Abbrechen
                            </IonButton> : null}
                    </IonItem>
                    <IonItemDivider>
                        <IonLabel>Log</IonLabel>
                    </IonItemDivider>
                    {logs?.map(log => <IonItem key={log.id}>
                        <IonLabel>{log.message}</IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonModal>
    );
};

export default EditFeed;
