import { useEffect, useState } from "react";

interface Supermarket {
    id: number
    name: string
    url: string
    img_src: string
    active: number
}

export const useSupermarketsName = () => {
    const [supermarketsNames, setSupermarketsNames] = useState<string[]>([])
      
    useEffect(() => {
        fetch("http://127.0.0.1:8000/supermarkets")
            .then((res) => res.json())
            .then((data) => setSupermarketsNames(data.map((supermarket: Supermarket) => supermarket.name)))
    }, []);

    return { supermarketsNames }
}