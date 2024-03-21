import {Block, BlockTitle, Button, List, ListInput, PageContent, Sheet} from "framework7-react";
import {useEffect, useState} from "react";

export const AddFeedSheet = ({open, onCreate, onAbort}: {
    open: boolean,
    onCreate: (url: string, name: string) => void,
    onAbort: () => void
}) => {
    const [error, setError] = useState<boolean>()
    const [name, setName] = useState<string>('')
    const [url, setURL] = useState<string>('')

    useEffect(() => {
        if (!open) {
            setName('')
            setURL('')
            setError(false)
        }
    }, [open]);

    return <Sheet push backdrop closeByBackdropClick onSheetClose={onAbort} opened={open} style={{height: "auto"}}>
        <PageContent>
            <BlockTitle large>Feed hinzufügen</BlockTitle>
            <Block>
                <List strong>
                    <ListInput type="text"
                               value={name}
                               autocomplete="no"
                               outline
                               errorMessageForce={error}
                               errorMessage="Pflichtfeld"
                               label="Name"
                               onInput={(e) => setName(e.target.value)}/>
                    <ListInput type="url"
                               value={url}
                               outline
                               autocomplete="no"
                               errorMessageForce={error}
                               errorMessage="Pflichtfeld"
                               label="URL"
                               onInput={(e) => setURL(e.target.value)}/>
                </List>
                <p className="grid grid-cols-2 grid-gap">
                    <Button onClick={async () => {
                        if (name && url) {
                            setError(false)
                            onCreate(url, name)
                        } else {
                            setError(true)
                        }
                    }}>Importieren</Button>
                    <Button onClick={async () => {
                        onAbort()
                        setError(false)
                    }}>Abbrechen</Button>
                </p>
            </Block>
        </PageContent>
    </Sheet>;
}