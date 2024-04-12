import React, {useEffect, useState} from "react";
import {IonInput, IonItem, IonList} from "@ionic/react";

interface FeedFormProps {
    name?: string,
    url?: string,
    keywords?: string,
    disabled?: boolean,
    onChange: (name: string, url: string, keywords: string) => void
}

const FeedForm: React.FC<FeedFormProps> = (props) => {
    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [keywords, setKeywords] = useState('')

    useEffect(() => {
        props.onChange(name, url, keywords)
    }, [keywords, name, props, props.onChange, url]);

    useEffect(() => {
        if (props.name) {
            setName(props.name)
        }
        if (props.url) {
            setURL(props.url)
        }
        if (props.keywords) {
            setKeywords(props.keywords)
        }

    }, [props]);

    return <IonList>
        <IonItem>
            <IonInput
                disabled={props.disabled}
                label="Name"
                labelPlacement="stacked"
                placeholder="Feed Name"
                value={name}
                onInput={(e) => {
                    setName(String(e.currentTarget.value))
                }}/>
        </IonItem>
        <IonItem>
            <IonInput
                disabled={props.disabled}
                label="Keywords"
                labelPlacement="stacked"
                placeholder=""
                value={keywords}
                onInput={(e) => {
                    setKeywords(String(e.currentTarget.value))
                }}/>
        </IonItem>
        <IonItem>
            <IonInput
                disabled={props.disabled}
                label="URL"
                labelPlacement="stacked"
                placeholder="https://example.com/gtfs.zip"
                value={url}
                onInput={(e) => {
                    setURL(String(e.currentTarget.value))
                }}/>
        </IonItem>
    </IonList>
}

export default FeedForm