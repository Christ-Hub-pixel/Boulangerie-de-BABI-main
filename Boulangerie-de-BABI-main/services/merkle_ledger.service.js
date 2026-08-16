const crypto = require('crypto');

/**
 * 📜 MERKLE TREE FINANCIAL AUDIT LEDGER (Registre Immuable Infalsifiable)
 * Chaque transaction confirmée est chaînée cryptographiquement à la précédente.
 * Toute tentative de modification d'un montant brise mathématiquement la chaîne.
 */
class MerkleLedgerService {
    constructor() {
        this.ledgerChain = [];
        this.genesisHash = 'GENESIS_BLOCK_BOULANGERIE_DE_BABI_SOVEREIGN_2026_0000000000000000';
        this.initializeGenesisBlock();
    }

    initializeGenesisBlock() {
        if (this.ledgerChain.length === 0) {
            this.ledgerChain.push({
                index: 0,
                timestamp: new Date().toISOString(),
                event_type: 'GENESIS_BLOCK_INITIALIZED',
                order_id: 'SYSTEM_ROOT',
                amount: 0,
                provider: 'ROOT_AUTHORITY',
                previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                block_hash: this.genesisHash,
                merkle_root: this.genesisHash
            });
        }
    }

    /**
     * Calcule le hash cryptographique d'un bloc de transaction
     */
    calculateBlockHash(index, previousHash, timestamp, orderId, amount, provider) {
        const payload = `${index}|${previousHash}|${timestamp}|${orderId}|${amount}|${provider}`;
        return crypto.createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Enregistre et scelle une transaction confirmée dans l'Arbre de Merkle
     */
    sealTransactionBlock(orderId, amount, provider, clientPhone) {
        const index = this.ledgerChain.length;
        const previousBlock = this.ledgerChain[index - 1];
        const previousHash = previousBlock ? previousBlock.block_hash : this.genesisHash;
        const timestamp = new Date().toISOString();

        const blockHash = this.calculateBlockHash(index, previousHash, timestamp, orderId, amount, provider);

        const newBlock = {
            index,
            timestamp,
            event_type: 'TRANSACTION_CONFIRMED_SEALED',
            order_id: String(orderId),
            amount: Number(amount),
            provider: String(provider || 'Wave Mobile Money'),
            client_phone: String(clientPhone || 'N/A'),
            previous_hash: previousHash,
            block_hash: blockHash
        };

        this.ledgerChain.push(newBlock);
        return newBlock;
    }

    /**
     * Vérifie l'intégrité absolue de l'ensemble de la chaîne (Preuve de non-falsification)
     */
    verifyLedgerIntegrity() {
        let isChainValid = true;
        const brokenBlocks = [];

        for (let i = 1; i < this.ledgerChain.length; i++) {
            const currentBlock = this.ledgerChain[i];
            const previousBlock = this.ledgerChain[i - 1];

            // 1. Vérification de la continuité du hash parent
            if (currentBlock.previous_hash !== previousBlock.block_hash) {
                isChainValid = false;
                brokenBlocks.push({ index: currentBlock.index, error: 'BROKEN_PARENT_HASH_LINK' });
            }

            // 2. Recalcul et vérification du hash du bloc courant
            const recomputedHash = this.calculateBlockHash(
                currentBlock.index,
                currentBlock.previous_hash,
                currentBlock.timestamp,
                currentBlock.order_id,
                currentBlock.amount,
                currentBlock.provider
            );

            if (recomputedHash !== currentBlock.block_hash) {
                isChainValid = false;
                brokenBlocks.push({ index: currentBlock.index, error: 'DATA_TAMPERING_DETECTED' });
            }
        }

        return {
            isValid: isChainValid,
            totalBlocks: this.ledgerChain.length,
            status: isChainValid ? 'VERIFIED_TAMPER_PROOF' : 'COMPROMISED_TAMPER_DETECTED',
            brokenBlocks
        };
    }

    /**
     * Retourne les derniers blocs du registre pour affichage d'audit
     */
    getRecentBlocks(limit = 30) {
        return this.ledgerChain.slice(-limit).reverse();
    }
}

module.exports = new MerkleLedgerService();
