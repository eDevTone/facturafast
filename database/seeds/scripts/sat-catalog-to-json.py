"""
Converts the c_Pais and c_Moneda sheets of the SAT's official catalog (catCFDI_V_4_*.xls) into the
JSON files the seed loads (database/seeds/data/c_pais.json and c_moneda.json).

Download the current catalog from http://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm
and run, with xlrd installed:

    python3 database/seeds/scripts/sat-catalog-to-json.py path/to/catCFDI_V_4_YYYYMMDD.xls
"""
import json
import os
import sys

import xlrd

OUT = os.path.join(os.path.dirname(__file__), '..', 'data')


def rows(sheet, header_first_cell):
    """Data rows after the header row whose first cell is `header_first_cell`."""
    start = next(r for r in range(sheet.nrows) if str(sheet.cell_value(r, 0)).strip() == header_first_cell) + 1
    for r in range(start, sheet.nrows):
        values = [sheet.cell_value(r, c) for c in range(sheet.ncols)]
        if str(values[0]).strip():
            yield values


def text(value):
    """Cell text; the catalog breaks long regexes over two lines inside one cell."""
    return str(value).replace('\n', '').strip() or None


def main(source):
    book = xlrd.open_workbook(source, on_demand=True)

    countries = [
        {'code': text(v[0]), 'description': text(v[1]), 'taxIdFormat': text(v[3])}
        for v in rows(book.sheet_by_name('c_Pais'), 'c_Pais')
    ]
    currencies = [
        {'code': text(v[0]), 'description': text(v[1]), 'decimals': int(v[2])}
        for v in rows(book.sheet_by_name('c_Moneda'), 'c_Moneda')
    ]

    for name, data in (('c_pais.json', countries), ('c_moneda.json', currencies)):
        with open(os.path.join(OUT, name), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print(name, len(data))


if __name__ == '__main__':
    main(sys.argv[1])
