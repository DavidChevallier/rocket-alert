import PropTypes from "prop-types";
import { Row, Col } from "antd";
import Tile from "./Tile";

const CurrentOperation = (props) => (
  <section className="section currentOperation">
    <Row gutter={[24, 24]} justify={"center"}>
      <Col xs={24} sm={12} md={8} lg={6}>
        <Tile
          title={"Operation Breaking Dawn"}
          subtitle={"Started Aug 5"}
          fromDate={new Date("2022-08-05 00:00")}
          alertsClient={props.alertsClient}
          showAverage
        />
      </Col>
    </Row>
  </section>
);

CurrentOperation.propTypes = {
  alertsClient: PropTypes.object.isRequired,
};
export default CurrentOperation;