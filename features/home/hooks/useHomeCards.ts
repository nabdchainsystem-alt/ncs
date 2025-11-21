import { useState } from 'react';
import { HomeCard } from '../types';

export const useHomeCards = () => {
    const [homeCards, setHomeCards] = useState<HomeCard[]>([]);

    const handleAddHomeCard = (cardType: { id: string; title: string; color: string }) => {
        let defaultW = 600;
        let defaultH = 400;

        if (cardType.id === 'agenda') {
            defaultH = 500;
        } else if (cardType.id === 'lineup') {
            defaultH = 400;
        }

        const GAP = 30;
        const START_X = 32;
        const START_Y = 20;

        const maxY = homeCards.reduce((max, card) => Math.max(max, card.y + card.h), START_Y - GAP);
        const x = START_X;
        const y = maxY + GAP;
        const maxZ = homeCards.reduce((max, card) => Math.max(max, card.zIndex || 0), 0);

        const newCard: HomeCard = {
            instanceId: Date.now().toString(),
            typeId: cardType.id,
            title: cardType.title,
            color: cardType.color,
            x: x,
            y: y,
            w: defaultW,
            h: defaultH,
            zIndex: maxZ + 1
        };
        setHomeCards(prev => [...prev, newCard]);
    };

    const handleUpdateHomeCard = (updatedCard: HomeCard) => {
        setHomeCards(prev => prev.map(c => c.instanceId === updatedCard.instanceId ? updatedCard : c));
    };

    const handleRemoveHomeCard = (instanceId: string) => {
        setHomeCards(prev => prev.filter(c => c.instanceId !== instanceId));
    };

    const handleRemoveHomeCardByType = (typeId: string) => {
        setHomeCards(prev => prev.filter(c => c.typeId !== typeId));
    };

    return {
        homeCards,
        handleAddHomeCard,
        handleUpdateHomeCard,
        handleRemoveHomeCard,
        handleRemoveHomeCardByType
    };
};
