type Item = {
    name: string;
    quantity: number;
    unitPrice?: number;
}

type Order = {
    items: Item[];
    date: Date;
    recipient: string;
};
