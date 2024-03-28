import {useEffect, useState} from "react";
import {showEstimatedQuota} from "../db/StorageManager.ts";
import {Card, CardContent, CardFooter, Progressbar} from "framework7-react";

export const StorageQuota = () => {
    const [quota, setQuota] = useState<StorageEstimate | undefined>()
    useEffect(() => {
        showEstimatedQuota().then(setQuota)
        const interval = setInterval(() => {
            showEstimatedQuota().then(setQuota)
        }, 1000)
        return () => clearInterval(interval)
    }, []);

    if (quota?.quota && quota?.usage) {
        const usageInMB = Math.fround(quota.usage / 1000000);
        const quotaInMB = Math.fround(quota.quota / 1000000);
        const usageInPercent = Math.ceil((usageInMB / quotaInMB) * 100);
        const formatter = new Intl.NumberFormat(['de'], {style: 'unit', unit: 'megabyte', maximumFractionDigits: 2})

        return <Card>
            <CardContent style={{paddingBottom: 0}}>
                <p>{usageInPercent} %</p>
                <Progressbar color="orange" progress={usageInPercent} style={{height: '1rem'}}/>
            </CardContent>
            <CardFooter>
                {formatter.format(usageInMB)} von {formatter.format(quotaInMB)} Verwendet
            </CardFooter>
        </Card>
    }

    return <></>
}