
async function doTask() {
    const closingAccounts = [
        { accountId: 'acc1', amount: 500 },
        { accountId: 'acc2', amount: 500 }
    ];

    const recipientAccounts = [
        { accountId: 'rec1', credit: 400 },
        // { accountId: 'rec1', credit: 250 },
        // { accountId: 'rec2', credit: 500 }
    ];

    newRebalancingTx(closingAccounts, recipientAccounts);

    /**
     * [Print in console all transactions and operational fees]
     * @param {[array]} closingAccounts [array of clossing accounts]
     * @param {[array]} recipientAccounts [array of recipient accounts]
     */
    function newRebalancingTx(closingAccounts, recipientAccounts)
    {
        try {
            validateAmounts(closingAccounts, recipientAccounts);

            let transactions = [];
            let fee = 0;

            closingAccounts.forEach((account, index, array) => {
                let recipients = recipientAccounts.filter(recipient => recipient.accountId.slice(3) === account.accountId.slice(3));
                let is_final = false;
                
                if (index === array.length - 1){ 
                    is_final = true;
                }

                if (recipients.length !== 0) {
                    const credit = recipients.reduce((sum, trx) => {
                        return sum + trx.credit;
                    }, 0);

                    const accountId = recipients[0].accountId;
                    const sum = account.amount - credit;

                    transactions.push([account.accountId, accountId, credit]);

                    if (sum > 0) {
                        transactions.push([account.accountId, null, sum]);
                    }
                } else if (!is_final) {
                    transactions.push([account.accountId, null, account.amount]);
                } else {
                    fee = (transactions.length + 1) * 10;
                    const total = account.amount - fee;
                    if (total <= 0) throw new Error('Not enough funds for rebalance')
                    transactions.push([account.accountId, null, total]);
                }
            });

            const response = makeResponse(transactions, fee);

            console.log(JSON.stringify(response));
        } catch (e) {
            console.error(e.message)
        }
    }

    /**
     * [validate if the amounts of the accounts are greater than 0]
     * @param {[array]} closingAccounts [array of clossing accounts]
     * @param {[array]} recipientAccounts [array of recipient accounts]
     * @throws {[Error]} Will throw an error if validation fail.
     */
    function validateAmounts(closingAccounts, recipientAccounts)
     {
        closingAccounts.forEach(account => {
            if(account.amount <= 0) {
                throw new Error('Server Error')
            }
        });

        recipientAccounts.forEach(account => {
            if(account.credit <= 0) {
                throw new Error('Server Error')
            }
        });

        const sumClosing = closingAccounts.reduce((sum, account) => {
            return sum + account.amount;
        }, 0);

        const sumRecipient = recipientAccounts.reduce((sum, account) => {
            return sum + account.credit;
        }, 0);

        if (sumRecipient > sumClosing) {
            throw new Error('Not enough funds for rebalance.')
        }
     }

    /**
     * [Returns an object with the transactions and the fee]
     * @param  {[array]} closingAccounts [transactions]
     * @param  {[number]} recipientAccounts [fee of transactions]
     * @return {[Object]}
     */
    function makeResponse(transfers, operationalFee) {
        return {
            transfers,
            operationalFee
        };
    }
}
  
doTask();