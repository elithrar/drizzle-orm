import { PgDialect } from '~/pg-core/dialect';
import { PgSession, PreparedQuery, PreparedQueryConfig, QueryResultHKT, QueryResultKind } from '~/pg-core/session';
import { AnyPgTable, InferModel, PgTable } from '~/pg-core/table';
import { QueryPromise } from '~/query-promise';
import { Query, SQL, SQLWrapper } from '~/sql';
import { orderSelectedFields } from '~/utils';
import { SelectFieldsFlat, SelectFieldsOrdered, SelectResultFields } from './select.types';

export interface PgDeleteConfig {
	where?: SQL | undefined;
	table: AnyPgTable;
	returning?: SelectFieldsOrdered;
}

export interface PgDelete<
	TTable extends AnyPgTable,
	TQueryResult extends QueryResultHKT,
	TReturning extends Record<string, unknown> | undefined = undefined,
> extends QueryPromise<TReturning extends undefined ? QueryResultKind<TQueryResult, never> : TReturning[]> {}

export class PgDelete<
	TTable extends AnyPgTable,
	TQueryResult extends QueryResultHKT,
	TReturning extends Record<string, unknown> | undefined = undefined,
> extends QueryPromise<TReturning extends undefined ? QueryResultKind<TQueryResult, never> : TReturning[]>
	implements SQLWrapper
{
	private config: PgDeleteConfig;

	constructor(
		table: TTable,
		private session: PgSession,
		private dialect: PgDialect,
	) {
		super();
		this.config = { table };
	}

	where(where: SQL | undefined): Omit<this, 'where'> {
		this.config.where = where;
		return this;
	}

	returning(): Omit<PgDelete<TTable, TQueryResult, InferModel<TTable>>, 'where' | 'returning'>;
	returning<TSelectedFields extends SelectFieldsFlat>(
		fields: TSelectedFields,
	): Omit<PgDelete<TTable, TQueryResult, SelectResultFields<TSelectedFields>>, 'where' | 'returning'>;
	returning(
		fields: SelectFieldsFlat = this.config.table[PgTable.Symbol.Columns],
	): Omit<PgDelete<TTable, any>, 'where' | 'returning'> {
		this.config.returning = orderSelectedFields(fields);
		return this;
	}

	/** @internal */
	getSQL(): SQL {
		return this.dialect.buildDeleteQuery(this.config);
	}

	toSQL(): Omit<Query, 'typings'> {
		const { typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
		return rest;
	}

	private _prepare(name?: string): PreparedQuery<
		PreparedQueryConfig & {
			execute: TReturning extends undefined ? QueryResultKind<TQueryResult, never> : TReturning[];
		}
	> {
		return this.session.prepareQuery(this.dialect.sqlToQuery(this.getSQL()), this.config.returning, name);
	}

	prepare(name: string): PreparedQuery<
		PreparedQueryConfig & {
			execute: TReturning extends undefined ? QueryResultKind<TQueryResult, never> : TReturning[];
		}
	> {
		return this._prepare(name);
	}

	override execute: ReturnType<this['prepare']>['execute'] = (placeholderValues) => {
		return this._prepare().execute(placeholderValues);
	};
}
