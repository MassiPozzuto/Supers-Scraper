export const reformatPrice = (price: number) => {
    const priceString = price.toString()
    const separatedPrice = priceString.split('.')

    if (separatedPrice.length == 1) {
        separatedPrice[1] = '00'
    } else if (separatedPrice[1].length < 2) {
        separatedPrice[1] += '0'
    }

    const indexPricePoints = []
    if (separatedPrice[0].length > 3) {
        for (let i = (separatedPrice[0].length - 3); i > 0; i = i - 3) {
            indexPricePoints.push(i)
        }
    } else {
        if (separatedPrice[1].length > 2) {
            separatedPrice[1] = separatedPrice[1].substring(0, 2)
        }
        return separatedPrice.join(',')
    }

    const subSeparatedPrice = []
    let partToDivide = separatedPrice[0]
    const separatedNewPrice = []
    for (let i = 0; i < indexPricePoints.length; i++) {
        subSeparatedPrice[0] = partToDivide.substring(0, indexPricePoints[i])
        subSeparatedPrice[1] = partToDivide.substring(indexPricePoints[i], partToDivide.length)

        partToDivide = subSeparatedPrice[0]

        separatedNewPrice.unshift(subSeparatedPrice[1])
        if (i == indexPricePoints.length - 1) {
            separatedNewPrice.unshift(subSeparatedPrice[0])
        }
    }

    if (separatedPrice[1].length > 2) {
        separatedPrice[1] = separatedPrice[1].substring(0, 2)
    }
    return `${separatedNewPrice.join('.')},${separatedPrice[1]}`
}
