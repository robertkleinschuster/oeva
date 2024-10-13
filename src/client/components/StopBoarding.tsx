import React from "react";
import {Boarding} from "../../shared/db/enums";

const StopBoarding: React.FC<{boarding: Boarding}> = ({boarding}) => {
    switch (boarding) {
        case Boarding.NONE:
            return <>Kein Ein- oder Ausstieg</>
        case Boarding.ONLY_BOARDING:
            return <>Nur Einstieg</>
        case Boarding.ONLY_DISEMBARKING:
            return <>Nur Ausstieg</>
        case Boarding.ON_REQUEST:
            return <>Bedarfshalt</>
        case Boarding.ON_CALL:
            return <>Bedarfshalt (Anruf)</>
    }
}

export default StopBoarding