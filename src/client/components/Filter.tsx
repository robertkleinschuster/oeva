import {
    IonButton,
    IonIcon,
    IonItem,
    IonItemDivider,
    IonLabel,
    IonNote,
    IonPopover,
    IonRange,
    IonToggle
} from "@ionic/react";
import {calcRingRadius} from "../../shared/Geo";
import {addHours, differenceInCalendarDays, format, subHours} from "date-fns";
import {add, calendar, remove, time} from "ionicons/icons";
import React, {useEffect, useState} from "react";
import {Stop} from "../../shared/db/schema";
import {FilterState} from "../../shared/repo";

interface FilterProps {
    stop: Stop,
    state: FilterState,
    onChange: (state: FilterState) => void;
}

const Filter: React.FC<FilterProps> = ({stop, state, onChange,}) => {
    const [ringSizeLabel, setRingSizeLabel] = useState(state.ringSize)
    const [dateLabel, setDateLabel] = useState(state.date)

    useEffect(() => {
        const delayInputTimeoutId = setTimeout(() => {
            onChange({...state, date: dateLabel});
        }, 500);
        return () => clearTimeout(delayInputTimeoutId);
    }, [dateLabel]);

    const dayDiff = differenceInCalendarDays(dateLabel, new Date())

    return <IonPopover trigger={"filter-" + stop?.stop_id} triggerAction="click">
        <IonItem>
            <IonRange value={ringSizeLabel}
                      min={1}
                      max={26}
                      snaps
                      labelPlacement="start"
                      onIonChange={(e) => onChange({...state, ringSize: e.detail.value as number})}
                      onIonInput={(e) => setRingSizeLabel(e.detail.value as number)}
            >
                <div
                    slot="label">{stop ? calcRingRadius(stop.h3_cell, ringSizeLabel as number) : 0} m
                </div>
            </IonRange>
        </IonItem>
        <IonItem>
            <IonLabel>
                ab {format(dateLabel, 'HH:mm')} Uhr{dayDiff ? <IonNote> <IonIcon icon={calendar}/>&nbsp;+{dayDiff}</IonNote> : null}
            </IonLabel>
            <IonButton onClick={() => {
                setDateLabel(subHours(dateLabel, 1))
            }}>
                <IonIcon slot="icon-only" icon={remove}></IonIcon>
            </IonButton>
            <IonButton onClick={() => {
                setDateLabel(new Date())
            }}>
                <IonIcon slot="icon-only" icon={time}></IonIcon>
            </IonButton>
            <IonButton onClick={() => {
                setDateLabel(addHours(dateLabel, 1))
            }}>
                <IonIcon slot="icon-only" icon={add}></IonIcon>
            </IonButton>
        </IonItem>
        <IonItem>
            <IonToggle checked={state.arrivals} onIonChange={() => onChange({...state, arrivals: !state.arrivals})}>Ankünfte anzeigen</IonToggle>
        </IonItem>
        <IonItemDivider>
            <IonLabel>Verkehrsmittel</IonLabel>
        </IonItemDivider>
        <IonItem>
            <IonToggle checked={state.rail} onIonChange={() => onChange({...state, rail: !state.rail})}>Züge</IonToggle>
        </IonItem>
        <IonItem>
            <IonToggle checked={state.subway}
                       onIonChange={() => onChange({...state, subway: !state.subway})}>U-Bahn</IonToggle>
        </IonItem>
        <IonItem>
            <IonToggle checked={state.trams}
                       onIonChange={() => onChange({...state, trams: !state.trams})}>Straßenbahnen</IonToggle>
        </IonItem>
        <IonItem>
            <IonToggle checked={state.busses}
                       onIonChange={() => onChange({...state, busses: !state.busses})}>Busse</IonToggle>
        </IonItem>
        <IonItem>
            <IonToggle checked={state.trolleybusses}
                       onIonChange={() => onChange({...state, trolleybusses: !state.trolleybusses})}>O-Busse</IonToggle>
        </IonItem>
        <IonItem>
            <IonToggle checked={state.other}
                       onIonChange={() => onChange({...state, other: !state.other})}>Andere</IonToggle>
        </IonItem>
    </IonPopover>
}

export default Filter