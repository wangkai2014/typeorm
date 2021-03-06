import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";

describe("query runner > drop exclusion constraint", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly drop exclusion constraint and revert drop", () => Promise.all(connections.map(async connection => {

        // Only PostgreSQL supports exclusion constraints.
        if (!(connection.driver instanceof PostgresDriver))
            return;

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        table!.exclusions.length.should.be.equal(1);

        await queryRunner.dropExclusionConstraint(table!, table!.exclusions[0]);

        table = await queryRunner.getTable("post");
        table!.exclusions.length.should.be.equal(0);

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.exclusions.length.should.be.equal(1);

        await queryRunner.release();
    })));

});
