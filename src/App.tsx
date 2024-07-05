import { Button, Container, Typography } from '@mui/material';
import { Line } from '@ant-design/charts';

function App() {
  const data = [
    { year: '1991', value: 3 },
    { year: '1992', value: 4 },
    { year: '1993', value: 3.5 },
    { year: '1994', value: 5 },
    { year: '1995', value: 4.9 },
    { year: '1996', value: 6 },
    { year: '1997', value: 7 },
    { year: '1998', value: 9 },
    { year: '1999', value: 13 },
  ];
  const config = {
    data,
    title: {
      visible: true,
      text: 'Line Graph',
    },
    xField: 'year',
    yField: 'value',
  };

  return (
    <Container maxWidth="md" style={{ marginTop: 60 }}>
      <Typography variant="h2" align="center" gutterBottom> OpenGPA </Typography>
      <Button variant="contained" color="primary" fullWidth>Hello World</Button>
      <Line {...config} />
    </Container>
  );
}

export default App;
