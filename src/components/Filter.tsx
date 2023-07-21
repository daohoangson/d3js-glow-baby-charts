import {
  Col,
  Input,
  Row as ContainerRow,
  Dropdown,
  DropdownItem
} from "muicss/react";
import * as React from "react";

import { Info, Row } from "../util/data";
import tz, { A_DAY } from "../util/tz";

interface ChildrenParam {
  filtered: Row[];
  rangeFrom: number;
  rangeTo: number;
}

interface FilterProps {
  children: (param: ChildrenParam) => React.ReactNode;
  info: Info;
  rows: Row[];
}

interface Filters {
  filtered?: Row[];
  rangeFrom?: number;
  rangeTo?: number;
}

interface FilterState extends Filters {
  rangeMin: number;
  rangeMax: number;
}

export default class Filter extends React.Component<FilterProps, FilterState> {
  constructor(props: FilterProps) {
    super(props);

    const { rows } = props;
    let rangeMin = Date.now();
    let rangeMax = 0;
    rows.forEach(r => {
      if (!r.t1) return;
      rangeMin = Math.min(rangeMin, r.t1);
      rangeMax = Math.max(rangeMax, r.t1);
    });

    this.state = {
      rangeMax,
      rangeMin
    };
  }

  componentWillMount() {
    this.filter();
  }

  filter(f: Filters = {}) {
    const { state: s } = this;
    const rangeFrom = f.rangeFrom || s.rangeFrom || s.rangeMin;
    const rangeTo0 = f.rangeTo || s.rangeTo;
    const defaultRange = (window.innerWidth < 500) ? (30 * A_DAY) : undefined;
    const rangeTo = typeof rangeTo0 === 'number' ? rangeTo0 : (typeof defaultRange === 'number' ? (rangeFrom + defaultRange) : s.rangeMax);
    const filtered: Row[] = [];
    const { rows } = this.props;

    rows.forEach(r => {
      if (r.t1 < rangeFrom) return;
      if (r.t1 > rangeTo) return;
      filtered.push(r);
    });

    this.setState(() => ({
      filtered,
      rangeFrom,
      rangeTo
    }));
  }

  onRangeFromChange(event: React.FormEvent<HTMLInputElement>) {
    const { parseYmd } = tz(this.props.info);
    const rangeFrom = parseYmd(event.currentTarget.value);
    if (!rangeFrom) return this.state.rangeMin;

    this.filter({ rangeFrom });
  }

  onRangeToChange(event: React.FormEvent<HTMLInputElement>) {
    const { parseYmd } = tz(this.props.info);
    const rangeTo = parseYmd(event.currentTarget.value);
    if (!rangeTo) return this.state.rangeMax;

    this.filter({ rangeTo });
  }

  render() {
    const { info } = this.props;
    const { filtered, rangeFrom, rangeMax, rangeMin, rangeTo } = this.state;
    const { format } = tz(info);

    return (
      <div>
        <ContainerRow>
          <Col xs={12} md={4}>
            <Input
              label="From"
              type="date"
              onChange={e => this.onRangeFromChange(e)}
              value={format(rangeFrom || rangeMin, "%Y-%m-%d")}
            />
          </Col>
          <Col xs={12} md={4}>
            <Input
              label="To"
              type="date"
              onChange={e => this.onRangeToChange(e)}
              value={format(rangeTo || rangeMax, "%Y-%m-%d")}
            />
          </Col>
          <Col xs={12} md={4}>
            <Dropdown label="Quick menu">
              <DropdownItem
                onClick={() =>
                  this.filter({
                    rangeFrom: rangeMin,
                    rangeTo: rangeMin + 30 * A_DAY
                  })
                }
              >
                The first month
              </DropdownItem>
              <DropdownItem
                onClick={() =>
                  this.filter({
                    rangeFrom: rangeMin,
                    rangeTo: rangeMin + 90 * A_DAY
                  })
                }
              >
                The first 3 months
              </DropdownItem>
              <DropdownItem
                onClick={() =>
                  this.filter({
                    rangeFrom: rangeMin,
                    rangeTo: rangeMin + 180 * A_DAY
                  })
                }
              >
                The first 6 months
              </DropdownItem>
              <DropdownItem
                onClick={() =>
                  this.filter({
                    rangeFrom: rangeMin,
                    rangeTo: rangeMax
                  })
                }
              >
                All data
              </DropdownItem>
            </Dropdown>
          </Col>
        </ContainerRow>
        {this.props.children({
          filtered: filtered || [],
          rangeFrom: rangeFrom || rangeMin,
          rangeTo: rangeTo || rangeMax
        })}
      </div>
    );
  }
}
