import { GetColumnData } from '~/column';
import { Param, Query, SQL, SQLWrapper } from '~/sql';
import { SQLiteDialect } from '~/sqlite-core/dialect';
import { PreparedQuery, SQLiteSession } from '~/sqlite-core/session';
import { AnySQLiteTable, GetTableConfig, InferModel, SQLiteTable } from '~/sqlite-core/table';
import { mapUpdateSet, orderSelectedFields, Simplify, UpdateSet } from '~/utils';
import { SelectFields, SelectFieldsOrdered, SelectResultFields } from './select.types';

export interface SQLiteUpdateConfig {
	where?: SQL | undefined;
	set: UpdateSet;
	table: AnySQLiteTable;
	returning?: SelectFieldsOrdered;
}

export type SQLiteUpdateSetSource<TTable extends AnySQLiteTable> = Simplify<
	{
		[Key in keyof GetTableConfig<TTable, 'columns'>]?:
			| GetColumnData<GetTableConfig<TTable, 'columns'>[Key], 'query'>
			| SQL;
	}
>;

export class SQLiteUpdateBuilder<
	TTable extends AnySQLiteTable,
	TResultType extends 'sync' | 'async',
	TRunResult,
> {
	declare protected $table: TTable;

	constructor(
		protected table: TTable,
		protected session: SQLiteSession,
		protected dialect: SQLiteDialect,
	) {}

	set(values: SQLiteUpdateSetSource<TTable>): SQLiteUpdate<TTable, TResultType, TRunResult> {
		return new SQLiteUpdate(this.table, mapUpdateSet(this.table, values), this.session, this.dialect);
	}
}

export interface SQLiteUpdate<
	TTable extends AnySQLiteTable,
	TResultType extends 'sync' | 'async',
	TRunResult,
	TReturning = undefined,
> extends SQLWrapper {}

export class SQLiteUpdate<
	TTable extends AnySQLiteTable,
	TResultType extends 'sync' | 'async',
	TRunResult,
	TReturning = undefined,
> implements SQLWrapper {
	declare protected $table: TTable;

	private config: SQLiteUpdateConfig;

	constructor(
		table: TTable,
		set: UpdateSet,
		private session: SQLiteSession,
		private dialect: SQLiteDialect,
	) {
		this.config = { set, table };
	}

	where(where: SQL | undefined): Omit<this, 'where'> {
		this.config.where = where;
		return this;
	}

	returning(): Omit<
		SQLiteUpdate<TTable, TResultType, TRunResult, InferModel<TTable>>,
		'where' | 'returning'
	>;
	returning<TSelectedFields extends SelectFields>(
		fields: TSelectedFields,
	): Omit<
		SQLiteUpdate<TTable, TResultType, TRunResult, SelectResultFields<TSelectedFields>>,
		'where' | 'returning'
	>;
	returning(
		fields: SelectFields = this.config.table[SQLiteTable.Symbol.Columns],
	): Omit<SQLiteUpdate<TTable, TResultType, TRunResult>, 'where' | 'returning'> {
		this.config.returning = orderSelectedFields(fields);
		return this;
	}

	/** @internal */
	getSQL(): SQL {
		return this.dialect.buildUpdateQuery(this.config);
	}

	toSQL(): Omit<Query, 'typings'> {
		const { typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}

	prepare(): PreparedQuery<
		{
			type: TResultType;
			run: TRunResult;
			all: TReturning extends undefined ? never : TReturning[];
			get: TReturning extends undefined ? never : TReturning;
			values: TReturning extends undefined ? never : any[][];
		}
	> {
		return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning);
	}

	run: ReturnType<this['prepare']>['run'] = (placeholderValues) => {
		return this.prepare().run(placeholderValues);
	};

	all: ReturnType<this['prepare']>['all'] = (placeholderValues) => {
		return this.prepare().all(placeholderValues);
	};

	get: ReturnType<this['prepare']>['get'] = (placeholderValues) => {
		return this.prepare().get(placeholderValues);
	};

	values: ReturnType<this['prepare']>['values'] = (placeholderValues) => {
		return this.prepare().values(placeholderValues);
	};
}
