import * as React from "react";

interface ChartProps {
  renderer: (element: Element) => any;
}

export default class Chart extends React.Component<ChartProps> {
  private ref = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate() {
    this.renderChart();
  }

  render() {
    return <div ref={this.ref} />;
  }

  renderChart() {
    const { renderer } = this.props;
    if (!renderer) return;

    const { current } = this.ref;
    if (!current) return;

    while (current.firstChild) {
      current.removeChild(current.firstChild);
    }

    renderer(current);
  }
}
