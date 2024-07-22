import {useEffect, useState} from "react";
import {showEstimatedQuota} from "../fs/StorageManager.ts";
import {IonProgressBar} from "@ionic/react";
import React from "react";

export const StorageQuota: React.FC = () => {
    const [quota, setQuota] = useState<StorageEstimate | undefined>()
    useEffect(() => {
        showEstimatedQuota().then(setQuota)
        const interval = setInterval(() => {
            showEstimatedQuota().then(setQuota)
        }, 60000)
        return () => clearInterval(interval)
    }, []);

    if (quota?.quota !== undefined && quota?.usage !== undefined) {
        const usageInMB = Math.fround(quota.usage / 1000000);
        const quotaInMB = Math.fround(quota.quota / 1000000);
        const usageInPercent = Math.ceil((usageInMB / quotaInMB) * 100);
        const formatter = new Intl.NumberFormat(['de'], {style: 'unit', unit: 'megabyte', maximumFractionDigits: 2})

        return <div className="ion-margin">
                <p>{usageInPercent} %</p>
                <IonProgressBar color="secondary" value={usageInPercent / 100} style={{height: '1rem'}}/>
                <p>{formatter.format(usageInMB)} von {formatter.format(quotaInMB)} Verwendet</p>
        </div>
    }

    return <></>
}