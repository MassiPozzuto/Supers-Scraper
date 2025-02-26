import { CustomSimpleIcon } from '../Icons/CustomSimpleIcon'
import Offer from '../../Models/Offer';
import './OfferBadge.css'

interface OfferBadgeProps {
    offer: Offer;
    normalPrice: number;
    onToggle: (offer: Offer) => void;
}

export const OfferBadge = ({ offer, normalPrice, onToggle }: OfferBadgeProps) => {
    const offerText = offer.text || `-${Math.round(100 - (offer.price * 100 / normalPrice))}%`;

    return (
        <span
            key={offer.id}
            title={`Oferta: ${offerText}. ${offer.isRestricted || ''}`}
            className={`offer-span ${offer.isRestricted ? 'offer-is-restricted' : ''} ${!offer.isActive ? 'deactivated' : ''}`}
            onClick={() => onToggle(offer)}
        >
            {offer.isRestricted && (
                <CustomSimpleIcon size={17} path="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 8v4M12 16h.01" />
            )}
            {offerText}
        </span>
    );
};
