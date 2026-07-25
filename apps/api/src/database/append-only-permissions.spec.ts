import { Client } from 'pg';

const TABLES = ['admin_audit_log', 'escrow_events'];

describe('Append-only enforcement (admin_audit_log, escrow_events)', () => {
    const connectionString = process.env.TEST_DATABASE_URL;

    if (!connectionString) {
        it.skip('TEST_DATABASE_URL not set — skipping real append-only enforcement test', () => {
            // Intentionally skipped, not passed: unlike the old psql-path-detection
            // fallback, this makes it visible in test output that the constraint
            // was NOT actually verified in this run.
        });
        // eslint-disable-next-line jest/no-focused-tests
        console.warn('[append-only-permissions.spec] TEST_DATABASE_URL not set — skipping DB-level enforcement test.');
        return;
    }

    let client: Client;

    beforeAll(async () => {
        client = new Client({ connectionString });
        await client.connect();
    });

    afterAll(async () => {
        await client.end();
    });

    // Catalog check first: confirms the trigger is actually attached to both
    // tables. Cheap, and doesn't depend on being able to insert a row (escrow_events
    // has a NOT NULL FK to transactions, which we don't want to fabricate here).
    for (const table of TABLES) {
        it(`has the append-only trigger attached to ${table}`, async () => {
            const result = await client.query(
                `SELECT tgname FROM pg_trigger
                 WHERE tgrelid = $1::regclass AND NOT tgisinternal AND tgname = $2`,
                [table, `${table}_append_only`],
            );
            expect(result.rowCount).toBe(1);
        });
    }

    // Behavioral check: actually fire the trigger. Run inside a transaction that
    // we always roll back, so the append-only guarantee itself doesn't block cleanup.
    it('actually rejects an UPDATE on admin_audit_log (not just "table missing")', async () => {
        await client.query('BEGIN');
        try {
            const inserted = await client.query(
                `INSERT INTO admin_audit_log (id, entity, action)
                 VALUES (gen_random_uuid(), 'test_entity', 'test_action') RETURNING id`,
            );
            const id = inserted.rows[0].id;

            await expect(
                client.query(`UPDATE admin_audit_log SET action = 'tampered' WHERE id = $1`, [id]),
            ).rejects.toThrow(/append-only/i);
        } finally {
            await client.query('ROLLBACK');
        }
    });

    it('does not confuse "table missing" with "update rejected"', async () => {
        // Sanity check: querying a genuinely nonexistent table should fail with
        // a different error than the append-only trigger, so a future schema
        // rename can't silently make this suite pass for the wrong reason.
        await expect(
            client.query('UPDATE definitely_not_a_real_table SET x = 1'),
        ).rejects.toThrow(/relation .* does not exist/i);
    });

});