interface MessageCardProps {
    header: string;
    body: string;
    img: string;
    backgroundColor: string;
    textColor: string;
}

export default function MessageCard({
    header,
    body,
    img,
    backgroundColor,
    textColor,
}: MessageCardProps) {
    return (
        <section
            className="message-card-section"
            style={{ backgroundColor: backgroundColor }}
        >
            <div className="text-div">
                <h1 style={{ color: textColor }}>{header}</h1>
                <p style={{ color: textColor }}>{body}</p>
            </div>
            <div className="img-div">
                <img src={img} alt="Nina Iseri" />
            </div>
        </section>
    );
}
