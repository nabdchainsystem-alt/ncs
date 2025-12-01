import { v4 as uuidv4 } from 'uuid';

export type Suit = 'H' | 'D' | 'C' | 'S';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type Color = 'red' | 'black';

export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    isFaceUp: boolean;
}

export interface GameState {
    stock: Card[];
    waste: Card[];
    foundations: {
        H: Card[];
        D: Card[];
        C: Card[];
        S: Card[];
    };
    tableau: Card[][];
    score: number;
    moves: number;
    startTime: number | null;
    isWon: boolean;
}

export class SolitaireGame {
    state: GameState;

    constructor() {
        this.state = this.getInitialState();
    }

    private getInitialState(): GameState {
        return {
            stock: [],
            waste: [],
            foundations: { H: [], D: [], C: [], S: [] },
            tableau: [[], [], [], [], [], [], []],
            score: 0,
            moves: 0,
            startTime: null,
            isWon: false,
        };
    }

    startNewGame() {
        const deck = this.createDeck();
        this.shuffleDeck(deck);

        const tableau: Card[][] = [[], [], [], [], [], [], []];

        // Deal to tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = deck.pop();
                if (card) {
                    if (i === j) card.isFaceUp = true; // Top card is face up
                    tableau[j].push(card);
                }
            }
        }

        this.state = {
            stock: deck,
            waste: [],
            foundations: { H: [], D: [], C: [], S: [] },
            tableau,
            score: 0,
            moves: 0,
            startTime: Date.now(),
            isWon: false,
        };
    }

    private createDeck(): Card[] {
        const suits: Suit[] = ['H', 'D', 'C', 'S'];
        const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck: Card[] = [];

        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({
                    id: uuidv4(),
                    suit,
                    rank,
                    isFaceUp: false,
                });
            }
        }
        return deck;
    }

    private shuffleDeck(deck: Card[]) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    drawCard() {
        if (this.state.stock.length > 0) {
            const card = this.state.stock.pop();
            if (card) {
                card.isFaceUp = true;
                this.state.waste.push(card);
            }
        } else {
            // Recycle waste to stock
            while (this.state.waste.length > 0) {
                const card = this.state.waste.pop();
                if (card) {
                    card.isFaceUp = false;
                    this.state.stock.push(card);
                }
            }
        }
        this.state.moves++;
    }

    // Helper to get card color
    private getCardColor(card: Card): Color {
        return (card.suit === 'H' || card.suit === 'D') ? 'red' : 'black';
    }

    // Helper to get rank value
    private getRankValue(rank: Rank): number {
        const values: Record<Rank, number> = {
            'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
        };
        return values[rank];
    }

    // Move from Waste to Tableau
    moveWasteToTableau(tableauIndex: number): boolean {
        const card = this.state.waste[this.state.waste.length - 1];
        if (!card) return false;

        const tableauPile = this.state.tableau[tableauIndex];
        const targetCard = tableauPile[tableauPile.length - 1];

        if (this.isValidTableauMove(card, targetCard)) {
            this.state.waste.pop();
            this.state.tableau[tableauIndex].push(card);
            this.state.moves++;
            this.state.score += 5;
            return true;
        }
        return false;
    }

    // Move from Waste to Foundation
    moveWasteToFoundation(): boolean {
        const card = this.state.waste[this.state.waste.length - 1];
        if (!card) return false;

        const foundationPile = this.state.foundations[card.suit];
        const targetCard = foundationPile[foundationPile.length - 1];

        if (this.isValidFoundationMove(card, targetCard)) {
            this.state.waste.pop();
            this.state.foundations[card.suit].push(card);
            this.state.moves++;
            this.state.score += 10;
            this.checkWinCondition();
            return true;
        }
        return false;
    }

    // Move from Tableau to Foundation
    moveTableauToFoundation(tableauIndex: number): boolean {
        const tableauPile = this.state.tableau[tableauIndex];
        const card = tableauPile[tableauPile.length - 1];
        if (!card) return false;

        const foundationPile = this.state.foundations[card.suit];
        const targetCard = foundationPile[foundationPile.length - 1];

        if (this.isValidFoundationMove(card, targetCard)) {
            tableauPile.pop();
            // Reveal next card
            if (tableauPile.length > 0) {
                const nextCard = tableauPile[tableauPile.length - 1];
                if (!nextCard.isFaceUp) {
                    nextCard.isFaceUp = true;
                    this.state.score += 5;
                }
            }
            this.state.foundations[card.suit].push(card);
            this.state.moves++;
            this.state.score += 10;
            this.checkWinCondition();
            return true;
        }
        return false;
    }

    // Move from Tableau to Tableau
    moveTableauToTableau(fromIndex: number, toIndex: number, cardIndex: number): boolean {
        const fromPile = this.state.tableau[fromIndex];
        const toPile = this.state.tableau[toIndex];

        const cardsToMove = fromPile.slice(cardIndex);
        const cardToMove = cardsToMove[0];
        const targetCard = toPile[toPile.length - 1];

        if (this.isValidTableauMove(cardToMove, targetCard)) {
            // Remove from source
            this.state.tableau[fromIndex] = fromPile.slice(0, cardIndex);

            // Reveal next card in source if needed
            if (this.state.tableau[fromIndex].length > 0) {
                const nextCard = this.state.tableau[fromIndex][this.state.tableau[fromIndex].length - 1];
                if (!nextCard.isFaceUp) {
                    nextCard.isFaceUp = true;
                    this.state.score += 5;
                }
            }

            // Add to destination
            this.state.tableau[toIndex] = [...toPile, ...cardsToMove];
            this.state.moves++;
            return true;
        }
        return false;
    }

    // Move from Foundation to Tableau (Undo-ish, but allowed in some rules)
    moveFoundationToTableau(suit: Suit, tableauIndex: number): boolean {
        const foundationPile = this.state.foundations[suit];
        const card = foundationPile[foundationPile.length - 1];
        if (!card) return false;

        const tableauPile = this.state.tableau[tableauIndex];
        const targetCard = tableauPile[tableauPile.length - 1];

        if (this.isValidTableauMove(card, targetCard)) {
            foundationPile.pop();
            tableauPile.push(card);
            this.state.moves++;
            this.state.score -= 15; // Penalty for taking back
            return true;
        }
        return false;
    }

    private isValidTableauMove(card: Card, targetCard?: Card): boolean {
        if (!targetCard) {
            return card.rank === 'K'; // Only Kings on empty spots
        }

        const cardColor = this.getCardColor(card);
        const targetColor = this.getCardColor(targetCard);

        if (cardColor === targetColor) return false; // Must be alternating colors

        const cardValue = this.getRankValue(card.rank);
        const targetValue = this.getRankValue(targetCard.rank);

        return targetValue === cardValue + 1; // Must be descending sequence
    }

    private isValidFoundationMove(card: Card, targetCard?: Card): boolean {
        if (!targetCard) {
            return card.rank === 'A'; // Only Aces on empty foundations
        }

        if (card.suit !== targetCard.suit) return false; // Must match suit

        const cardValue = this.getRankValue(card.rank);
        const targetValue = this.getRankValue(targetCard.rank);

        return cardValue === targetValue + 1; // Must be ascending sequence
    }

    private checkWinCondition() {
        const totalFoundationCards =
            this.state.foundations.H.length +
            this.state.foundations.D.length +
            this.state.foundations.C.length +
            this.state.foundations.S.length;

        if (totalFoundationCards === 52) {
            this.state.isWon = true;
        }
    }
}
