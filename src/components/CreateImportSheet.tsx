import {Block, BlockTitle, Button, List, ListInput, PageContent, Sheet} from "framework7-react";
import {useState} from "react";

export const CreateImportSheet = ({open, onCreate, onAbort}: {
    open: boolean,
    onCreate: (url: string, name: string) => void,
    onAbort: () => void
}) => {
    const [error, setError] = useState<boolean>()
    const [name, setName] = useState<string>()
    const [url, setURL] = useState<string>()

    return <Sheet push backdrop closeByBackdropClick onSheetClose={onAbort} opened={open} style={{height: "auto"}}>
        <PageContent>
            <BlockTitle large>Import hinzufügen</BlockTitle>
            <Block>
                <List strong>
                    <ListInput outline errorMessageForce={error} errorMessage="Pflichtfeld" label="Name"
                               onInput={(e) => setName(e.target.value)}/>
                    <ListInput outline errorMessageForce={error} errorMessage="Pflichtfeld" label="URL"
                               onInput={(e) => setURL(e.target.value)}/>
                </List>
                <p className="grid grid-cols-2 grid-gap">
                    <Button onClick={async () => {
                        if (name && url) {
                            setError(false)
                            onCreate(name, url)
                            setURL('');
                            setName('')
                        } else {
                            setError(true)
                        }
                    }}>Importieren</Button>
                    <Button onClick={async () => {
                        onAbort()
                    }}>Abbrechen</Button>
                </p>
            </Block>
        </PageContent>
    </Sheet>;
}