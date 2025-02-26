import { AnyMySqlTable } from '~/mysql-core/table';
import { MySqlColumn, MySqlColumnBuilder, MySqlColumnBuilderWithAutoIncrement, MySqlColumnWithAutoIncrement } from './common';

export class MySqlSerialBuilder extends MySqlColumnBuilderWithAutoIncrement<{
	data: number;
	driverParam: number;
	notNull: true;
	hasDefault: true;
}> {
	constructor(name: string) {
		super(name);
		this.config.hasDefault = true;
		this.config.autoIncrement = true;
	}

	/** @internal */
	override build<TTableName extends string>(
		table: AnyMySqlTable<{ name: TTableName }>,
	): MySqlSerial<TTableName> {
		return new MySqlSerial(table, this.config);
	}
}

export class MySqlSerial<
	TTableName extends string,
> extends MySqlColumnWithAutoIncrement<{
	tableName: TTableName;
	data: number;
	driverParam: number;
	notNull: true;
	hasDefault: true;
}> {
	protected override $mySqlColumnBrand!: 'MySqlSerial';

	getSQLType(): string {
		return 'serial';
	}

	override mapFromDriverValue(value: number | string): number {
		if (typeof value === 'string') {
			return parseInt(value);
		}
		return value;
	}
}

export function serial(name: string) {
	return new MySqlSerialBuilder(name);
}
