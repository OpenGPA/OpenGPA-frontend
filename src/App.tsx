import { Autocomplete, Button, Card, CardContent, Container, Grid, MenuItem, Select, SelectChangeEvent, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Graph } from './apihandle';
import React, { useEffect, useState } from 'react';
import { Area, Column, DualAxes, Gauge, Pie, Tiny } from '@ant-design/charts';

function wrapUrl(url: string) {
  const urlprefix = process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : 'https://api.opengpa.icu';
  return urlprefix + url;
}

interface GPAOverview {
  semester: string;
  gpa: string;
  value: number;
}
interface TypeOverview {
  type: string;
  value: number;
}

interface Overview {
  semester: string;
  value: number;
}

interface TotalEntry {
  semester: string;
  total: number;
  a_grade: number;
  ave_gpa: number;
}

function App() {
  const query = new URLSearchParams(window.location.search);
  const course = query.get('course');

  const [courseName, setCourseName] = React.useState(course == null ? '计算机编程' : course);
  const [allCourse, setAllCourse] = React.useState([] as string[]);
  const [semester, setSemester] = React.useState(null as string | null);
  const [allSemester, setAllSemester] = React.useState([] as string[]);
  const [gpaOverview, setGpaOverview] = React.useState([] as GPAOverview[]);
  const [seriesOverview, setSeriesOverview] = React.useState([] as TypeOverview[]);
  const [totalOverview, setTotalOverview] = React.useState([] as TotalEntry[]);
  const [arateOverview, setArateOverview] = React.useState([] as Overview[]);
  const [data, setData] = useState([] as any[]);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newSemester: string,
  ) => {
    if (newSemester == '') {
      setSemester(null);
    }
    else {
      setSemester(newSemester);
    }
  };

  const ClickEvent = () => {
    fetch(wrapUrl("/api/v1/getCourses"))
      .then(response => response.json())
      .then(result => setAllCourse(result))
      .catch(error => console.log('error', error));
  }

  // get courses on loaded
  useEffect(() => {
    fetch(wrapUrl("/api/v1/getCourses"))
      .then(response => response.json())
      .then(result => setAllCourse(result))
      .catch(error => console.log('error', error));
  }, [])

  // get overview on course change
  useEffect(() => {
    fetch(wrapUrl("/api/v1/getOverviewByCourseName"), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "course_name": courseName })
    })
      .then(response => response.json())
      .then(result => {
        // gpa overview
        var gparesult = [] as GPAOverview[];
        Object.keys(result['gpa']).forEach((sem) => {
          Object.keys(result['gpa'][sem]).forEach((grade) => {
            gparesult.push({ semester: sem, gpa: grade, value: result['gpa'][sem][grade] })
          })
        });

        gparesult.sort();

        setGpaOverview(gparesult);

        // series type
        var seriesresult = [] as TypeOverview[];
        Object.keys(result['series']).forEach((stutype) => {
          seriesresult.push({ type: stutype, value: result['series'][stutype] })
        });
        setSeriesOverview(seriesresult);

        // arate overview
        var arateresult = [] as Overview[];
        Object.keys(result['arate']).forEach((sem) => {
          arateresult.push({ semester: sem, value: result['arate'][sem] })
        });
        setArateOverview(arateresult);

        // all semester
        var semresult = result['semester'] as string[];
        semresult.sort((a, b) => {
          return a.localeCompare(b);
        });
        setAllSemester(semresult)
        setSemester(null)

        // total overview
        var totalresult = [] as TotalEntry[];
        semresult.forEach((sem) => {
          const aGrade = result['gpa'][sem].hasOwnProperty('4.0') ? result['gpa'][sem]['4.0'] : 0 
            + result['gpa'][sem].hasOwnProperty('3.7') ? result['gpa'][sem]['3.7'] : 0;
          const total = result['total'][sem];
          const sumGPA = Object.keys(result['gpa'][sem]).reduce((acc, cur) => {
            if(cur === '未通过')
              return acc;
            else
              return acc + parseFloat(cur) * result['gpa'][sem][cur];
          }, 0)
          totalresult.push({
            semester: sem,
            total: total,
            a_grade: aGrade,
            ave_gpa: sumGPA / total,
          })
        })
        console.log(totalresult)
        setTotalOverview(totalresult);
      })
      .catch(error => console.log('error', error));
  }, [courseName])

  // get data on semester / course change
  useEffect(() => {
    fetch(wrapUrl("/api/v1/getGPAByCourseName"), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(semester == null ? { "course_name": courseName } : { "course_name": courseName, "semester": semester })
    })
      .then((response) => response.json())
      .then((json) => {
        var result = [] as any[]
        for (let GPA in json) {
          for (let id in json[GPA]) {
            result.push({ GPA: GPA, id: id, value: json[GPA][id] });
          }
        }
        result.sort((a, b) => {
          return a.GPA - b.GPA;
        });
        setData(result);

        // let getEle = document.getElementById('detail');
        // getEle?.scrollIntoView();
      })
      .catch((error) => {
        console.log('fetch data failed', error);
      });
  }, [semester, courseName])

  const TrendGraph = () => {
    const trendConfig = {
      data: gpaOverview,
      height: 400,
      xField: 'semester',
      yField: 'value',
      colorField: 'gpa',
      percent: true,
      stack: true,
      interaction: {
        tooltip: {
          shared: true,
        },
      },
      tooltip: { channel: 'y0', valueFormatter: '.0%' },
      annotations: [],
    };
    return <div style={{ height: '400px' }}><Column {...trendConfig} onlyChangeData={true} /></div>
  }

  const DetailGraph = () => {
    const allInfoConfig = {
      data,
      height: 600,
      xField: 'GPA',
      yField: 'value',
      stack: true,
      colorField: 'id',
      label: {
        text: (originData: any) => {
          const val = parseInt(originData.value);
          if (semester == null)
            return ''
          return val;
        },
        textBaseline: 'bottom',
        position: 'inside',
      },
      annotations: [],
    };
    return <div style={{ height: '650px' }}><Column {...allInfoConfig} onlyChangeData={true} /></div>
  }

  const ARateGraph = () => {
    const data = arateOverview;
    const config = {
      data,
      // width: 480,
      height: 80,
      shapeField: 'smooth',
      xField: 'semester',
      yField: 'value',
      style: {
        fill: 'linear-gradient(-90deg, white 0%, #1565c0 100%)',
        fillOpacity: 0.6,
      },
      annotations: [
        {
          type: 'lineY',
          data: [0.3],
          label: {
            text: '30%',
            position: 'left',
            style: { textBaseline: 'top' },
          },
          style: { stroke: 'rgba(0, 0, 0)' },
        },
        {
          type: 'text',
          style: {
            text: '3.7+率',
            x: '50%',
            y: '50%',
            textAlign: 'center',
            fontSize: 16,
            fillOpacity: 0.5,
          }
        }
      ]
    };
    return <div style={{ height: 80, paddingTop: 10 }}><Tiny.Area {...config} onlyChangeData={true} /></div>;
  };

  const ARateRecentGraph = () => {
    const percent = (arateOverview.length > 0 ? arateOverview[arateOverview.length - 1].value : 0);
    const config = {
      percent,
      // width: 250,
      height: 250,
      autoFit: true,
      padding: 20,
      color: ['#E8EFF5', '#66AFF4'],
      annotations: [
        {
          type: 'text',
          style: {
            text: `优秀率\n${(percent * 100).toFixed(2)}%`,
            x: '50%',
            y: '50%',
            textAlign: 'center',
            fontSize: 16,
            fontStyle: 'bold',
          },
        },
      ],
    };

    return <Tiny.Ring {...config} onlyChangeData={true} />;
  }

  const PersonaGraph = () => {
    const config = {
      data: seriesOverview,
      height: 250,
      autoFit: true,
      // width: 250,
      angleField: 'value',
      colorField: 'type',
      legend: false,
      innerRadius: 0.6,
      labels: [
        { text: 'type', style: { fontSize: 10, fontWeight: 'bold' } },
        {
          text: (d: any, i: any, data: any) => (i < data.length - 3 ? d.value : ''),
          style: {
            fontSize: 9,
            dy: 12,
          },
        },
      ],
      style: {
        stroke: '#fff',
        inset: 1,
        radius: 10,
      },
      scale: {
        color: {
          palette: 'spectral',
          offset: (t: any) => t * 0.8 + 0.1,
        },
      },
      annotations: [
        {
          type: 'text',
          style: {
            text: '专业分布',
            x: '50%',
            y: '50%',
            textAlign: 'center',
            fontSize: 20,
            fontStyle: 'bold',
          },
        },
      ],
    };
    return <Pie {...config} onlyChangeData={true} />;
  }

  const TotalGraph = () => {
    const config = {
      data: totalOverview,
      children: [
        {
          type: 'area',
          xField: 'semester',
          yField: ['total', 'a_grade'],
          shapeField: 'smooth',
          // transform: [{ type: 'groupX', y: 'mean', y1: 'mean' }],
          style: { fill: '#85c5A6', fillOpacity: 0.3 },
          axis: { y: { title: 'A 人数 / 总人数 (人)', titleFill: '#85C5A6' } },
          tooltip: {
            items: [
              { channel: 'y', valueFormatter: '.1f' },
              { channel: 'y1', valueFormatter: '.1f' },
            ],
          },
        },
        {
          type: 'line',
          xField: 'semester',
          yField: 'ave_gpa',
          shapeField: 'smooth',
          // transform: [{ type: 'groupX', y: 'mean' }],
          style: { stroke: 'steelblue' },
          scale: { y: { nice: false } },
          axis: {
            y: {
              position: 'right',
              title: '平均绩点',
              titleFill: 'steelblue',
            },
          },
          tooltip: { items: [{ channel: 'y', valueFormatter: '.1f' }] },
        },
      ],
    };
    return <DualAxes {...config} onlyChangeData={true} />;
  }

  return (
    <Container maxWidth="md" style={{ marginTop: 60 }}>
      <Stack spacing={2} >
        <Typography variant="h2" align="center" gutterBottom> OpenGPA </Typography>
        <Button variant="contained" color="primary" fullWidth onClick={ClickEvent}>获取所有课程</Button>
        {/* <Select
          color='primary'
          label="学期"
          value={courseName}
          onChange={(event: SelectChangeEvent) => setCourseName(event.target.value)}
        >
          {allCourse.map((value) => (
            <MenuItem value={value} key={value}>{value}</MenuItem>
          ))}
        </Select> */}
        <Autocomplete
          disablePortal
          id="combo-box-course"
          options={allCourse}
          renderInput={(params) => <TextField {...params} label="课程名称" />}
          onChange={(event: any, newValue: string | null) => {
            if (newValue === null)
              return;
            else
              setCourseName(newValue);
          }}
        />

        <Card>
          <ARateGraph />
          <CardContent>
            <Typography gutterBottom variant="h4" component="div" style={{ fontWeight: 'bold' }}>{courseName}</Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>数据来自 OpenGPA 数据库，仅供参考</Typography>
            <Grid container
              spacing={{ xs: 2, md: 3 }}
              columns={{ xs: 4, sm: 8, md: 12 }}
              padding={1}
              direction="row"
              justifyContent="center"
              alignItems="center"
            >
              <Grid xs={4} sm={6} md={8} item>
                <TotalGraph />
              </Grid>
              <Grid xs={4} sm={2} md={4} columns={4}
                direction="column"
                justifyContent="center"
                alignItems="center">
                <Grid xs={4} item>
                  <ARateRecentGraph />
                </Grid>
                <Grid xs={4} item>
                  <PersonaGraph />
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>


        <Stack spacing={2}>
          <Typography variant="h6" align="center" gutterBottom>给分趋势</Typography>
          <TrendGraph />
        </Stack>

        <Stack spacing={2}>
          <Typography variant="h6" align="center" gutterBottom>学期详情</Typography>
          <Typography variant="body2" align="center" gutterBottom>学期: {semester == null ? "所有" : semester}</Typography>
          <ToggleButtonGroup
            id="detail"
            color="primary"
            value={semester}
            exclusive
            onChange={handleChange}
            aria-label="Semester"
            style={{
              overflow: 'auto'
            }}
            fullWidth
          >
            {allSemester.map((value) => (
              <ToggleButton value={value} key={value}>{value}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <DetailGraph />
        </Stack>
      </Stack>
    </Container>
  );
}

export default App;