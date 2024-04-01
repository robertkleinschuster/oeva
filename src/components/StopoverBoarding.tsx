import React from "react";
import {Boarding} from "../db/Schedule";

const StopoverBoarding: React.FC<{boarding: Boarding}> = ({boarding}) => {
    switch (boarding) {
        case Boarding.NONE:
            return <>Kein Ein- oder Ausstieg</>
        case Boarding.ONLY_BOARDING:
            return <>Nur Ausstieg</>
        case Boarding.ONLY_DISEMBARKING:
            return <>Nur Einstieg</>
        case Boarding.ON_REQUEST:
            return <>Bedarfshalt</>
        case Boarding.ON_CALL:
            return <>Bedarfshalt (Anruf)</>
    }
}

export default StopoverBoarding