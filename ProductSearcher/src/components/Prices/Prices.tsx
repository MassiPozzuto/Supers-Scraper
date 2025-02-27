import { useContext, useState } from "react"
import { CartContext } from "../../contexts/Cart.Context"
import { OfferBadge } from "../OfferBadge/OfferBadge"
import OfferType from "../../Models/Offer"
import { reformatPrice } from "../../utils/reformatPrice"
import './Prices.css'

interface PricesProps {
    id: string
    normalPrice: number
    offers: OfferType[] | null
    forWhat: string
}

export const Prices = ({ id, normalPrice, offers, forWhat }: PricesProps) => {
    const { setProductsInTheCart } = useContext(CartContext)
    const [activeOffers, setActiveOffers] = useState(offers?.sort((a, b) => a.price - b.price) || null)
    const betterOffer = activeOffers?.find((offer) => offer.isActive)

    const handleOfferToggle = (offerClicked: OfferType) => {
        if (offerClicked.isRestricted === null) return
        
        setActiveOffers((prevOffers) => {
            if (prevOffers === null) return null
            return prevOffers?.map((offer) =>
                (offer.id !== offerClicked.id) ? offer : { ...offer, isActive: !offer.isActive }
            )
        })
        
        if (forWhat === 'cartOffer') {
            setProductsInTheCart((prevProducts) =>
                prevProducts.map((product) => {
                    if (product.id !== id) return product
                    
                    return {
                        ...product,
                        offers: product.offers?.map((offer) =>
                            (offer.id !== offerClicked.id) ? offer : { ...offer, isActive: !offer.isActive }
                        ) || null
                    }
                })
            )
        }
    }

    return (
        <div className={activeOffers ? `product__info--price on-sale ${forWhat}` : `product__info--price ${forWhat}`}>
            { 
                activeOffers &&
                (
                    <div className="container__offers">
                        {
                            activeOffers.map((offer) => (
                                <OfferBadge key={offer.id} offer={offer} normalPrice={normalPrice} onToggle={handleOfferToggle} />   
                            ))
                        }
                    </div>
                )

            }
            <div className="prices">
                {
                    betterOffer &&
                    (
                        <div>
                            <span className="offer-price">${reformatPrice(Number(betterOffer.price))}</span>
                            {
                                betterOffer.text && (<span className="prices-c-u">c/u</span>)
                            }
                        </div>
                    )
                }
                <span className={betterOffer ? 'old-price' : 'actual-price'}>${reformatPrice(normalPrice)}</span>
            </div>  
        </div>
    )
}