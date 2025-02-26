import { useEffect, useState } from "react";

const SPEED = 150
const DELAY_BETWEEN_SUPERMARKETS = 1000

export const TypeWritter = ( { words } : { words: string[]} ) => {
    const [wordIndex, setWordIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        if (words.length === 0) return

        const currentText: string = words[wordIndex] || ""

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (charIndex < currentText.length) {
                    setCharIndex((prev) => prev + 1)
                } else {
                    setTimeout(() => setIsDeleting(true), DELAY_BETWEEN_SUPERMARKETS)
                }
            } else {
                if (charIndex > 0) {
                    setCharIndex((prev) => prev - 1)
                } else {
                    setIsDeleting(false);
                    setWordIndex((prev) => (prev + 1) % words.length)
                }
            }
        }, SPEED);

        return () => {
            clearTimeout(timeout)
        }
    }, [words, charIndex, isDeleting, wordIndex])

    return (
        <span style={{
            color: "#f7a235",
            display: "inline - block",
            borderRight: "2px solid #f7a235",
            whiteSpace: "nowrap",
            overflow: "hidden",
            verticalAlign: "bottom",
            animation: "caret 1s steps(1) infinite"
        }}>
            {words[wordIndex]?.substring(0, charIndex) || ""}
        </span>
    )
}