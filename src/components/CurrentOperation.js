import PropTypes from "prop-types";
import React from "react";
import { Row, Col, Button } from "antd";
import Tile from "./Tile";
import { eachDayOfInterval, isSameDay } from "date-fns";
import {
  getNow,
  getYesterday,
  dayOfMonthFormat,
  isBiWeeklyDifference,
  weekRangeFormat,
} from "../date_helper";
import { Column, Bar } from "@ant-design/plots";
import Tracking from "../tracking";
import withIsVisibleHook from "./withIsVisibleHook";

class CurrentOperation extends React.Component {
  state = {
    data: [],
    showGraphByWeek: false,
    showGraphByDay: false,
    showGraphByOrigin: false,
    graphByDayType: "Column",
    graphByWeekConfig: null,
    graphByDayConfig: null,
    graphByOriginConfig: null,
    selectedMonth: null,
    isLoadingChart: false,
  };

  componentDidMount() {
    this.getDetailedAlerts().then((alerts) => {
      if (!alerts || alerts.length === 0) {
        return;
      }
      this.buildAlertsByWeekGraph(alerts);
      this.buildAlertsByDayGraph(alerts);
      this.buildAlertsBySourceGraph(alerts);
    });

    window.addEventListener("resize", this.updateGraphConfig);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateGraphConfig);
  }

  updateGraphConfig = () => {
    const columnConfig = {
      xField: "day",
      yField: "count",
      seriesField: "",
      columnStyle: {
        radius: [20, 20, 0, 0],
      },
      maxColumnWidth: 40,
      color: "#5c0011",
      appendPadding: [50, 0, 10, 10],
      autoFit: true,
      label: {
        position: "top",
        autoHide: true,
        autoRotate: true,
        autoEllipsis: true,
        style: {
          fill: "black",
          opacity: 1,
          fontSize: 16,
        },
      },
      xAxis: {
        label: {
          autoHide: true,
          autoRotate: true,
          style: {
            fill: "black",
            fontSize: 14,
          },
        },
      },
      yAxis: false,
    };
    const barConfig = {
      xField: "count",
      yField: "day",
      barStyle: {
        radius: [20, 20, 0, 0],
      },
      autoFit: false,
      maxBarWidth: 20,
      color: "#5c0011",
      appendPadding: [30, 50, 0, 0],
      label: {
        position: "right",
        autoHide: true,
        autoRotate: true,
        autoEllipsis: true,
        style: {
          fill: "black",
          opacity: 1,
          fontSize: 16,
        },
      },
      yAxis: {
        label: {
          autoHide: false,
          autoRotate: true,
          style: {
            fill: "black",
            fontSize: 16,
          },
        },
      },
      xAxis: false,
    };

    const vw = Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    );
    const graphByDayType = vw >= 768 ? "Column" : "Bar";
    const config = graphByDayType === "Column" ? columnConfig : barConfig;
    if (graphByDayType === "Bar") {
      if (this.state.graphByDayConfig.data.length <= 10) {
        config.height = 200;
      } else if (this.state.graphByDayConfig.data.length <= 20) {
        config.height = config.height = 400;
      } else {
        config.height = config.height = 700;
      }
    }

    // We need to "reset" graphByDayType for Ant Design chart to re-render properly
    this.setState({ graphByDayType: null, isLoadingChart: true }, () => {
      setTimeout(() => {
        this.setState({
          isLoadingChart: false,
          graphByDayType,
          graphByDayConfig: {
            data: this.state.graphByDayConfig.data,
            ...config,
          },
        });
      }, 10);
    });
  };

  getDetailedAlerts = () =>
    this.props.alertsClient
      .getDetailedAlerts(new Date("2023-10-07"), getNow())
      .then((res) => {
        return res.payload;
      })
      .catch((error) => {
        Tracking.detailedAlertsByDayError(error);
        console.error(error);
        return null;
      });

  buildAlertsByWeekGraph = (alertsPerDay) => {
    // Alerts By Month

    // let data = [];
    // let monthlyAlertCount = 0;
    // let currentMonth = "10"; // Starting from October
    // alertsPerDay.forEach(({ alerts, timeStamp }) => {
    //   const [year, month, day] = timeStamp.split("-");
    //   if (currentMonth !== month) {
    //     data.push({
    //       month: currentMonth,
    //       count: monthlyAlertCount,
    //     });
    //     currentMonth = month;
    //     monthlyAlertCount = 0;
    //   }

    //   monthlyAlertCount += alerts;
    // });

    // data.push({
    //   month: currentMonth,
    //   count: monthlyAlertCount,
    // });
    let data = [];
    let biweeklyAlertCount = 0;
    let weekDate = new Date(2023, 9, 7);
    alertsPerDay.forEach(({ alerts, date }) => {
      const [year, month, day] = date.split("-");
      const theDate = new Date(year, month - 1, day);
      if (isBiWeeklyDifference(weekDate, theDate)) {
        data.push({
          week: weekRangeFormat(weekDate, theDate),
          count: biweeklyAlertCount,
        });
        weekDate = theDate;
        biweeklyAlertCount = 0;
      }

      biweeklyAlertCount += alerts.length;
    });

    data.push({
      week: `${dayOfMonthFormat(weekDate)} - ${dayOfMonthFormat(getNow())}`,
      count: biweeklyAlertCount,
    });

    this.setState({
      showGraphByWeek: true,
      graphByWeekConfig: {
        data,
        xField: "week",
        yField: "count",
        seriesField: "",
        // columnWidthRatio: 0.5,
        columnStyle: {
          radius: [20, 20, 0, 0],
        },
        color: "#5c0011",
        appendPadding: [30, 0, 0, 0],
        label: {
          position: "top",
          style: {
            fill: "black",
            opacity: 1,
            fontSize: 16,
          },
        },
        xAxis: {
          label: {
            autoHide: true,
            autoRotate: true,
            style: {
              fill: "black",
              fontSize: 14,
            },
          },
        },
        yAxis: false,
      },
    });
  };

  buildAlertsByDayGraph = (alertsPerDay) => {
    let dataIndex = 0;
    const data = { months: [] };
    const datesInterval = eachDayOfInterval({
      start: new Date("2023-10-07T00:00"),
      end: getYesterday(),
    });

    datesInterval.forEach((dateInterval) => {
      const monthName = dateInterval.toLocaleString("default", {
        month: "long",
      });
      if (!data.months.includes(monthName)) {
        data.months.push(monthName);
        data[monthName] = [];
      }

      if (dataIndex >= alertsPerDay.length) {
        data[monthName].push({ day: dayOfMonthFormat(dateInterval), count: 0 });
      } else {
        const [year, month, day] = alertsPerDay[dataIndex].date.split("-");
        const dateOfAlerts = new Date(year, month - 1, day);
        /* If there's alert data for this dateInterval, use it
           Otherwise, there's no alert data since alerts = 0
        */
        if (isSameDay(dateInterval, dateOfAlerts)) {
          data[monthName].push({
            day: dayOfMonthFormat(dateInterval),
            count: alertsPerDay[dataIndex].alerts.length,
          });
          dataIndex = dataIndex + 1;
        } else {
          data[monthName].push({
            day: dayOfMonthFormat(dateInterval),
            count: 0,
          });
        }
      }
    });

    const selectedMonth = data.months[data.months.length - 1];

    this.setState({
      showGraphByDay: true,
      byDayData: data,
      selectedMonth,
      graphByDayConfig: {
        data: data[selectedMonth],
      },
    });

    this.updateGraphConfig();
  };

  buildAlertsBySourceGraph = (alertsPerDay) => {
    let data = [];
    let originSouthCount = 0;
    let originNorthCount = 0;
    let weekDate = new Date(2023, 9, 7);
    alertsPerDay.forEach(({ alerts, date }) => {
      const [year, month, day] = date.split("-");
      const theDate = new Date(year, month - 1, day);
      if (isBiWeeklyDifference(weekDate, theDate)) {
        data.push({
          week: weekRangeFormat(weekDate, theDate),
          count: originSouthCount,
          origin: "Gaza / Hamas",
        });
        data.push({
          week: weekRangeFormat(weekDate, theDate),
          count: originNorthCount,
          origin: "Southern Lebanon / Hezbollah",
        });
        weekDate = theDate;
        originSouthCount = 0;
        originNorthCount = 0;
      }

      let originSouth = 0;
      let originNorth = 0;
      alerts.forEach((alert) => {
        if (
          alert.areaNameEn === "Gaza Envelope" ||
          alert.areaNameEn === "Western Negev" ||
          alert.areaNameEn === "Southern Negev" ||
          alert.areaNameEn === "Central Negev" ||
          alert.areaNameEn === "Shfelat Yehuda" ||
          alert.areaNameEn === "Shfela (Lowlands)" ||
          alert.areaNameEn === "Judea" ||
          alert.areaNameEn === "Lakhish" ||
          alert.areaNameEn === "Western Lakhish" ||
          alert.areaNameEn === "Dead Sea" ||
          alert.areaNameEn === "Eilat" ||
          alert.areaNameEn === "Arabah" ||
          alert.areaNameEn === "Bika'a" ||
          alert.areaNameEn === "Jerusalem" ||
          alert.areaNameEn === "Yarkon" ||
          alert.areaNameEn === "Dan" ||
          alert.areaNameEn === "Sharon"
        ) {
          originSouth += 1;
        } else if (
          alert.areaNameEn === "HaAmakim" ||
          alert.areaNameEn === "Samaria" ||
          alert.areaNameEn === "Southern Golan" ||
          alert.areaNameEn === "Upper Galilee" ||
          alert.areaNameEn === "Lower Galilee" ||
          alert.areaNameEn === "Menashe" ||
          alert.areaNameEn === "Confrontation Line" ||
          alert.areaNameEn === "Wadi Ara" ||
          alert.areaNameEn === "Center Galilee" ||
          alert.areaNameEn === "HaMifratz" ||
          alert.areaNameEn === "HaCarmel" ||
          alert.areaNameEn === "Beit Sha'an Valley" ||
          alert.areaNameEn === "Northern Golan" ||
          alert.areaNameEn === "HaAmakim"
        ) {
          originNorth += 1;
        }
      });

      originSouthCount += originSouth;
      originNorthCount += originNorth;
    });

    data.push({
      week: `${dayOfMonthFormat(weekDate)} - ${dayOfMonthFormat(getNow())}`,
      count: originSouthCount,
      origin: "Gaza / Hamas",
    });
    data.push({
      week: `${dayOfMonthFormat(weekDate)} - ${dayOfMonthFormat(getNow())}`,
      count: originNorthCount,
      origin: "Southern Lebanon / Hezbollah",
    });

    this.setState({
      showGraphByOrigin: true,
      graphByOriginConfig: {
        data,
        xField: "week",
        yField: "count",
        isGroup: true,
        seriesField: "origin",
        // columnWidthRatio: 0.5,
        columnStyle: {
          radius: [20, 20, 0, 0],
        },
        color: ["#008000", "#F7E210", "#5c0011"],
        appendPadding: [30, 0, 0, 0],
        label: {
          position: "top",
          style: {
            fill: "black",
            opacity: 1,
            fontSize: 16,
          },
        },
        xAxis: {
          label: {
            autoHide: true,
            autoRotate: true,
            style: {
              fill: "black",
              fontSize: 14,
            },
          },
        },
        yAxis: false,
      },
    });
  };

  handleMonthClick = (month) => {
    Tracking.graphMonthClick(month);
    this.setState(
      {
        selectedMonth: month,
        graphByDayConfig: {
          ...this.state.graphByDayConfig,
          data: this.state.byDayData[month],
        },
      },
      () => {
        this.updateGraphConfig();
      }
    );
  };

  render() {
    return (
      <section ref={this.props.isIntersectingRef} className="current-operation">
        <div className="currentOperationTile">
          <h2>Rocket alerts in current conflict</h2>
          <Row gutter={[24, 24]} justify={"center"}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Tile
                title={"Operation Swords of Iron"}
                subtitle={"Since October 7, 2023"}
                fromDate={new Date("2023-10-07")}
                // toDate={new Date("2022-08-08T00:00")}
                alertsClient={this.props.alertsClient}
                showAverage
              />
            </Col>
          </Row>
        </div>
        {(this.state.showGraphByWeek ||
          this.state.showGraphByDay ||
          this.state.showGraphByOrigin) && (
          <div className="current-operation-graph">
            <Row gutter={[24, 24]} justify={"center"}>
              {this.state.showGraphByWeek && (
                <Col span={24}>
                  <h2>Bi-weekly alerts since Oct 7</h2>
                  <Column {...this.state.graphByWeekConfig} />
                </Col>
              )}
              {this.state.showGraphByDay && (
                <Col span={24}>
                  <h2>Alerts by day since Oct 7</h2>
                  <Row justify={"center"} className={"month-list"}>
                    {this.state.byDayData.months.map((month) => (
                      <Col xs={24} md={4} lg={3} key={month}>
                        <Button
                          size="large"
                          type="text"
                          className={
                            this.state.selectedMonth === month
                              ? "month-button selected"
                              : "month-button"
                          }
                          onClick={() => this.handleMonthClick(month)}
                        >
                          {month}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                  {this.state.isLoadingChart && (
                    <Row
                      gutter={[24, 24]}
                      justify={"center"}
                      align={"middle"}
                      className={"loading-chart"}
                    ></Row>
                  )}
                  {this.state.graphByDayType === "Column" && (
                    <Column {...this.state.graphByDayConfig} />
                  )}
                  {this.state.graphByDayType === "Bar" && (
                    <Bar {...this.state.graphByDayConfig} />
                  )}
                </Col>
              )}
              {this.state.showGraphByOrigin && (
                <>
                  <Col span={24}>
                    <h2>Alerts by source since Oct 7</h2>
                    <Column {...this.state.graphByOriginConfig} />
                  </Col>
                  <Col gutter={[24, 24]}>
                    Estimation only. Based on alert location and its distance
                    from the Gaza Strip vs Southern Lebanon. Alerts from Gaza
                    may also include rockets shot by Islamic Jihad; Alerts from Southern Lebanon
                    may also include rockets shot by other Iranian proxies.
                  </Col>
                </>
              )}
            </Row>
          </div>
        )}
      </section>
    );
  }
}

CurrentOperation.propTypes = {
  alertsClient: PropTypes.object.isRequired,
  // For Tracking
  isIntersectingRef: PropTypes.object.isRequired,
};

export default withIsVisibleHook(CurrentOperation, "CurrentOperation");
