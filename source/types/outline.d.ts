export interface Outline {
    text: string;
    type?: string;
    xmlUrl?: string;
    outline?: XmlOutline;
}

export interface XmlOutline {
    $: Outline;
    outline?: XmlOutline[];
}
