
export type Suit = 'H' | 'D' | 'C' | 'S'; // Hearts, Diamonds, Clubs, Spades
export type Rank = '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    id: string; // unique id for React keys
}

export type PlayerId = 0 | 1 | 2 | 3; // 0 is User, 1 is Right, 2 is Top, 3 is Left

export interface Player {
    id: PlayerId;
    name: string;
    hand: Card[];
    team: 0 | 1; // 0 for players 0 & 2, 1 for players 1 & 3
    isBot: boolean;
}

export interface GameState {
    deck: Card[];
    players: Player[];
    currentTrick: { playerId: PlayerId; card: Card }[];
    currentTurn: PlayerId;
    trumpSuit: Suit | null;
    gameType: 'SUN' | 'HOKUM' | null; // Sun (No trumps, order changed) or Hokum (Trumps)
    scores: { team0: number; team1: number };
    dealer: PlayerId;
    phase: 'BIDDING' | 'PLAYING' | 'FINISHED';
    lastTrickWinner: PlayerId | null;
    tricksCollected: { team0: number; team1: number }; // Number of tricks or points
}

// Card values for Hokum (Trump)
const HOKUM_VALUES: Record<Rank, number> = {
    'J': 20, '9': 14, 'A': 11, '10': 10, 'K': 4, 'Q': 3, '8': 0, '7': 0
};

// Card values for Sun (No Trump)
const SUN_VALUES: Record<Rank, number> = {
    'A': 11, '10': 10, 'K': 4, 'Q': 3, 'J': 2, '9': 0, '8': 0, '7': 0
};

// Rank order for comparison
const HOKUM_ORDER: Rank[] = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];
const SUN_ORDER: Rank[] = ['A', '10', 'K', 'Q', 'J', '9', '8', '7'];

export class BalootGame {
    state: GameState;

    constructor() {
        this.state = this.getInitialState();
    }

    getInitialState(): GameState {
        return {
            deck: [],
            players: [
                { id: 0, name: 'You', hand: [], team: 0, isBot: false },
                { id: 1, name: 'Khalid', hand: [], team: 1, isBot: true },
                { id: 2, name: 'Ahmed', hand: [], team: 0, isBot: true },
                { id: 3, name: 'Omar', hand: [], team: 1, isBot: true },
            ],
            currentTrick: [],
            currentTurn: 0,
            trumpSuit: null,
            gameType: null,
            scores: { team0: 0, team1: 0 },
            dealer: 0,
            phase: 'BIDDING',
            lastTrickWinner: null,
            tricksCollected: { team0: 0, team1: 0 }
        };
    }

    initializeDeck(): Card[] {
        const suits: Suit[] = ['H', 'D', 'C', 'S'];
        const ranks: Rank[] = ['7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const deck: Card[] = [];

        suits.forEach(suit => {
            ranks.forEach(rank => {
                deck.push({ suit, rank, id: `${suit}-${rank}` });
            });
        });

        return this.shuffle(deck);
    }

    shuffle(deck: Card[]): Card[] {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    startNewRound() {
        const deck = this.initializeDeck();
        // Deal 5 cards to each player initially (standard Baloot deal is 3-2, then bidding, then rest)
        // For simplicity v1: Deal all 8 cards to everyone and pick a random game type/trump

        const players = [...this.state.players];
        for (let i = 0; i < 4; i++) {
            players[i].hand = deck.slice(i * 8, (i + 1) * 8);
        }

        // Randomly set game type for v1 to skip complex bidding UI
        const gameTypes: ('SUN' | 'HOKUM')[] = ['SUN', 'HOKUM'];
        const suits: Suit[] = ['H', 'D', 'C', 'S'];

        const randomType = gameTypes[Math.floor(Math.random() * gameTypes.length)];
        const randomTrump = randomType === 'HOKUM' ? suits[Math.floor(Math.random() * suits.length)] : null;

        this.state = {
            ...this.state,
            deck: [],
            players,
            currentTrick: [],
            currentTurn: (this.state.dealer + 1) % 4 as PlayerId, // Player after dealer starts
            trumpSuit: randomTrump,
            gameType: randomType,
            phase: 'PLAYING',
            tricksCollected: { team0: 0, team1: 0 }
        };
    }

    playCard(playerId: PlayerId, cardId: string): boolean {
        if (this.state.phase !== 'PLAYING') return false;
        if (this.state.currentTurn !== playerId) return false;

        const player = this.state.players[playerId];
        const cardIndex = player.hand.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;

        const card = player.hand[cardIndex];

        // Validate move (follow suit logic)
        if (!this.isValidMove(playerId, card)) return false;

        // Remove card from hand
        const newHand = [...player.hand];
        newHand.splice(cardIndex, 1);

        const newPlayers = [...this.state.players];
        newPlayers[playerId] = { ...player, hand: newHand };

        const newTrick = [...this.state.currentTrick, { playerId, card }];

        this.state = {
            ...this.state,
            players: newPlayers,
            currentTrick: newTrick,
            currentTurn: (playerId + 1) % 4 as PlayerId,
        };

        // Check if trick is complete
        if (newTrick.length === 4) {
            this.resolveTrick();
        }

        return true;
    }

    isValidMove(playerId: PlayerId, card: Card): boolean {
        if (this.state.currentTrick.length === 0) return true; // First player can play anything

        const leadCard = this.state.currentTrick[0].card;
        const playerHand = this.state.players[playerId].hand;

        // Must follow suit if possible
        const hasLeadSuit = playerHand.some(c => c.suit === leadCard.suit);
        if (hasLeadSuit && card.suit !== leadCard.suit) {
            return false;
        }

        // If Hokum and cannot follow suit, must trump if possible (and if opponent owns the trick)
        // Simplified: Just enforce follow suit for now.

        return true;
    }

    resolveTrick() {
        const trick = this.state.currentTrick;
        const leadSuit = trick[0].card.suit;
        let winnerIndex = 0;
        let winningCard = trick[0].card;

        for (let i = 1; i < 4; i++) {
            const played = trick[i].card;

            if (this.isHigher(played, winningCard, leadSuit)) {
                winningCard = played;
                winnerIndex = i;
            }
        }

        const winnerId = trick[winnerIndex].playerId;
        const winnerTeam = this.state.players[winnerId].team;

        // Calculate points
        let points = 0;
        trick.forEach(t => {
            points += this.getCardValue(t.card);
        });

        // Update state
        setTimeout(() => {
            this.state = {
                ...this.state,
                currentTrick: [],
                currentTurn: winnerId,
                lastTrickWinner: winnerId,
                tricksCollected: {
                    ...this.state.tricksCollected,
                    [`team${winnerTeam}`]: this.state.tricksCollected[`team${winnerTeam}` as 'team0' | 'team1'] + points
                }
            };

            // Check if round is over
            if (this.state.players[0].hand.length === 0) {
                this.endRound();
            }
        }, 1500); // Delay to show the trick result
    }

    isHigher(card: Card, currentHigh: Card, leadSuit: Suit): boolean {
        const isTrump = (c: Card) => this.state.gameType === 'HOKUM' && c.suit === this.state.trumpSuit;

        // If card is trump and currentHigh is not, card wins
        if (isTrump(card) && !isTrump(currentHigh)) return true;
        // If currentHigh is trump and card is not, currentHigh wins (card doesn't win)
        if (!isTrump(card) && isTrump(currentHigh)) return false;

        // If both are trumps, compare using HOKUM order
        if (isTrump(card) && isTrump(currentHigh)) {
            return HOKUM_ORDER.indexOf(card.rank) < HOKUM_ORDER.indexOf(currentHigh.rank);
        }

        // If neither are trumps
        if (card.suit !== leadSuit) return false; // Can't win if not following suit (and not trump)
        if (currentHigh.suit !== leadSuit) return true; // Should not happen if currentHigh was leading or winning, but safety check

        // Both follow suit, compare based on game type
        const order = this.state.gameType === 'HOKUM' ? HOKUM_ORDER : SUN_ORDER; // Actually Sun order applies to non-trump suits in Hokum too mostly, but let's simplify
        // Correction: In Hokum, non-trump suits use standard ranking (A, 10, K...), same as Sun.
        // Only the Trump suit uses the special J, 9 order.

        const rankOrder = (this.state.gameType === 'HOKUM' && card.suit === this.state.trumpSuit)
            ? HOKUM_ORDER
            : SUN_ORDER;

        return rankOrder.indexOf(card.rank) < rankOrder.indexOf(currentHigh.rank);
    }

    getCardValue(card: Card): number {
        if (this.state.gameType === 'HOKUM' && card.suit === this.state.trumpSuit) {
            return HOKUM_VALUES[card.rank];
        }
        return SUN_VALUES[card.rank];
    }

    endRound() {
        // Add round points to total scores
        // Simplified scoring
        const scores = { ...this.state.scores };
        scores.team0 += this.state.tricksCollected.team0;
        scores.team1 += this.state.tricksCollected.team1;

        this.state = {
            ...this.state,
            phase: 'FINISHED',
            scores
        };
    }
}
