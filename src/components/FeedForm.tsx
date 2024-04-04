import React, {useEffect, useState} from "react";
import {IonCheckbox, IonInput, IonItem, IonList} from "@ionic/react";

interface FeedFormProps {
    name?: string,
    url?: string,
    ifopt?: boolean,
    onChange: (name: string, url: string, ifopt: boolean) => void
}

const FeedForm: React.FC<FeedFormProps> = (props) => {
    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [ifopt, setIFOPT] = useState(false)

    useEffect(() => {
        props.onChange(name, url, ifopt)
    }, [ifopt, name, props, props.onChange, url]);

    useEffect(() => {
        if (props.name) {
            setName(props.name)
        }
        if (props.url) {
            setURL(props.url)
        }
        if (props.ifopt) {
            setIFOPT(props.ifopt)
        }

    }, [props]);

    return <IonList>
        <IonItem>
            <IonInput
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