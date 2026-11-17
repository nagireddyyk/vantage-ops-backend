
import { sequelize, User } from './src/models/index.js';

async function resetDatabase() {
  let connection;

  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();

    // Make sure Super Admin exists before resetting anything
    const admin = await User.findByPk(1);

    if (!admin) {
      throw new Error(
        'Super Admin with ID 1 not found. Database reset cancelled.'
      );
    }

    // Acquire one connection so FK settings remain active
    // throughout the reset.
    connection = await sequelize.connectionManager.getConnection({
      type: 'WRITE',
      useMaster: true
    });

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {
      connection
    });

    // Find every actual database table
    const [tables] = await sequelize.query(
      "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'",
      { connection }
    );

    // Empty every table except users
    for (const row of tables) {
      const tableName = Object.values(row)[0];

      if (tableName.toLowerCase() === 'users') {
        continue;
      }

      console.log(`Clearing table: ${tableName}`);

      const safeName = String(tableName).replace(/`/g, '``');

      await sequelize.query(
        `TRUNCATE TABLE \`${safeName}\``,
        { connection }
      );
    }

    // Keep only Super Admin (ID 1)
    await sequelize.query(
      'DELETE FROM `users` WHERE `id` <> 1',
      { connection }
    );

    // Next user will receive ID 2
    await sequelize.query(
      'ALTER TABLE `users` AUTO_INCREMENT = 2',
      { connection }
    );

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', {
      connection
    });

    console.log('--------------------------------');
    console.log('DATABASE RESET COMPLETED');
    console.log('Super Admin ID 1 preserved');
    console.log('All other tables cleared');
    console.log('User AUTO_INCREMENT set to 2');
    console.log('--------------------------------');

  } catch (error) {
    console.error('Database reset failed:', error);

    if (connection) {
      try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', {
          connection
        });
      } catch (restoreError) {
        console.error('Could not restore FK checks:', restoreError);
      }
    }

    process.exitCode = 1;

  } finally {
    if (connection) {
      await sequelize.connectionManager.releaseConnection(connection);
    }

    await sequelize.close();
  }
}

resetDatabase();
