const cds = require('@sap/cds');

const { UPDATE, SELECT } = cds.ql;

class DisciplinaryAPIService extends cds.ApplicationService {

    async init() {

        const { Cases } = this.entities;

        const { CaseNumberCounter } = cds.entities('disciplinary.db');

        // Generate Case ID before inserting a new Case
        this.before('CREATE', Cases, async (req) => {

            const tx = cds.tx(req);

            // Increment the counter
            const result = await tx.run(
                UPDATE(CaseNumberCounter)
                    .set({
                        lastNumber: { '+=': 1 }
                    })
                    .where({
                        counterName: 'CASE'
                    })
            );

            // Check whether the counter exists
            if (!result) {
                return req.reject(
                    500,
                    'Case number counter is not initialized.'
                );
            }

            // Fetch the updated counter value
            const counter = await tx.run(
                SELECT.one
                    .from(CaseNumberCounter)
                    .columns('lastNumber')
                    .where({
                        counterName: 'CASE'
                    })
            );

            if (!counter) {
                return req.reject(
                    500,
                    'Unable to retrieve the Case number counter.'
                );
            }

            // Generate the Case ID
            const nextNumber = Number(counter.lastNumber);

            req.data.caseID = `CASE${String(nextNumber).padStart(3, '0')}`;

            console.log(
                `[Disciplinary] Generated Case ID: ${req.data.caseID}`
            );

        });

        return super.init();
    }
}

module.exports = DisciplinaryAPIService;