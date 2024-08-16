import { Autocomplete, Button, Card, CardContent, Container, Grid, IconButton, MenuItem, Select, SelectChangeEvent, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AreaChart, AreaChartProps, BarChart, BarChartProps, ColumnChart, ColumnChartProps, DualAxesChart, DualAxesChartProps, LiquidChart, LiquidChartProps, PieChart, PieChartProps } from '@opd/g2plot-react';
import DualAxes from '@opd/g2plot-react/lib/plots/dual-axes';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function wrapUrl(url: string) {
  const urlprefix = process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : 'https://api.opengpa.icu';
  // const urlprefix = "https://api.opengpa.icu";
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
  // total: number;
  // non_a_grade: number;
  value: number;
  type: string;
  ave_gpa: number;
}

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  const query = new URLSearchParams(window.location.search);
  const course = query.get('course');

  const [courseName, setCourseName] = React.useState(course == null ? '计算机编程' : course);
  const [allCourse, setAllCourse] = React.useState([] as string[]);
  const [semester, setSemester] = React.useState(null as string | null);
  const [allSemester, setAllSemester] = React.useState([] as string[]);
  const [updateTime, setUpdateTime] = React.useState('');
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
          const aGrade = (result['gpa'][sem].hasOwnProperty('4.0') ? result['gpa'][sem]['4.0'] : 0)
            + (result['gpa'][sem].hasOwnProperty('3.7') ? result['gpa'][sem]['3.7'] : 0);
          const total = result['total'][sem];
          const sumGPA = Object.keys(result['gpa'][sem]).reduce((acc, cur) => {
            if (cur === '未通过')
              return acc;
            else
              return acc + parseFloat(cur) * result['gpa'][sem][cur];
          }, 0)
          totalresult.push({
            semester: sem,
            // total: total,
            // non_a_grade: total - aGrade,
            value: aGrade,
            type: '4.0',
            ave_gpa: sumGPA / total,
          })

          totalresult.push({
            semester: sem,
            // total: total,
            // non_a_grade: total - aGrade,
            value: total - aGrade,
            type: 'non-4.0',
            ave_gpa: sumGPA / total,
          })
        })
        setTotalOverview(totalresult);

        const update = new Date(result['update'] * 1000);
        setUpdateTime(update.toLocaleDateString());
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

  // const TrendGraph = () => {
  const trendConfig: ColumnChartProps = {
    data: gpaOverview,
    height: 400,
    xField: 'semester',
    yField: 'value',
    seriesField: 'gpa',
    isPercent: true,
    isStack: true,
    // interaction: {
    //   tooltip: {
    //     shared: true,
    //   },
    // },
    // tooltip: { channel: 'y0', valueFormatter: '.0%' },
    // annotations: [],
  };
  //   return <div style={{ height: '450px' }}><ColumnChart {...trendConfig} /></div>
  // }

  const DetailGraph = () => {
    const allInfoConfig: ColumnChartProps = {
      data,
      height: 600,
      xField: 'GPA',
      yField: 'value',
      seriesField: 'id',
      isStack: true,
      // label: {
      //   text: (originData: any) => {
      //     const val = parseInt(originData.value);
      //     if (semester == null)
      //       return ''
      //     return val;
      //   },
      //   textBaseline: 'bottom',
      //   position: 'inside',
      // },
      // annotations: [],
    };
    return <div style={{ height: '650px' }}><ColumnChart {...allInfoConfig} /></div>
  }

  // const ARateGraph = () => {
  const arateConfig: AreaChartProps = {
    data: arateOverview,
    xField: 'semester',
    yField: 'value',
    xAxis: {
      verticalFactor: 1,
    },
    yAxis: false,
    height: 80,
    // padding: [5, -70, 0, -70],
    padding: [5, -10, 0, -10],
    smooth: true,
    tooltip: false,
    areaStyle: () => {
      // return { fill: 'linear-gradient(-90deg, white 0%, #1565c0 100%)', }
      return { fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff' }
    },
    annotations: [
      {
        type: 'regionFilter',
        start: ['min', 0.3],
        end: ['max', '0'],
        color: '#D1D6E0',
        animate: true,
      },
      {
        type: 'line',
        start: ['min', 0.3],
        end: ['max', 0.3],
        text: {
          content: '30%',
          offsetY: -2,
          offsetX: 5,
          style: {
            textAlign: 'left',
            fontSize: 10,
            fill: theme.palette.text.secondary,
            textBaseline: 'bottom',
          },
        },
        style: {
          stroke: theme.palette.text.secondary,
        },
      },
      // {
      //   type: 'text',
      //   style: {
      //     text: '3.7+率',
      //     x: '50%',
      //     y: '50%',
      //     textAlign: 'center',
      //     fontSize: 16,
      //     fillOpacity: 0.5,
      //   }
      // }
    ]
  };
  //   return <div style={{ height: 80, paddingTop: 10 }}><AreaChart {...config} /></div>;
  // };

  // const ARateRecentGraph = () => {
  const arateRecentConfig: LiquidChartProps = {
    percent: (arateOverview.length > 0 ? arateOverview[arateOverview.length - 1].value : 0),
    // width: 250,
    height: 250,
    autoFit: true,
    // outline: {
    //   border: 4,
    //   distance: 8,
    // },
    wave: {
      length: 128,
    },
    statistic: {
      title: {
        formatter: () => '3.7+ 率',
        style: ({ percent }) => ({
          fill: percent > 0.65 ? 'white' : theme.palette.text.secondary,
        })
      },
      content: {
        style: ({ percent }) => ({
          fill: percent > 0.4 ? 'white' : theme.palette.text.secondary,
          fontSize: '32px'
        })
      }
    }
  };

  //   return <LiquidChart {...config} />;
  // }

  // const PersonaGraph = () => {
  const personaConfig: PieChartProps = {
    data: seriesOverview,
    height: 250,
    autoFit: true,
    // width: 250,
    angleField: 'value',
    colorField: 'type',
    legend: false,
    innerRadius: 0.6,
    meta: {
      value: {
        formatter: (v) => `${v}`,
      },
    },
    label: {
      type: 'inner',
      offset: '-50%',
      style: {
        textAlign: 'center',
      },
      autoRotate: true,
      // content: '{name}',
      formatter: ({ percent }) => (percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ''),
    },
    statistic: {
      title: {
        offsetY: -4,
        customHtml: (container, view, datum) => {
          const text = datum ? datum.type : '专业分布';
          return `<span style="color:${theme.palette.text.secondary}; padding-top: 2px">${text}</span>`;
        }
      },
      content: {
        offsetY: 4,
        style: {
          fontSize: '32px',
          color: theme.palette.text.secondary,
        },
      },
    },
    // interactions: [{ type: 'element-selected' }, { type: 'element-active' }, { type: 'pie-statistic-active' }],
    interactions: [],
  };
  //   return <PieChart {...config} />;
  // }

  // const TotalGraph = () => {
  const totalConfig: DualAxesChartProps = {
    data: [totalOverview, totalOverview],
    xField: 'semester',
    yField: ['value', 'ave_gpa'],

    geometryOptions: [
      {
        geometry: 'column',
        isStack: true,
        seriesField: 'type',
      },
      {
        geometry: 'line',
        color: '#9A67BD',
        smooth: true,
        lineStyle: {
          lineWidth: 2,
          stroke: '#9A67BD',
        },
      },
    ],
    // children: [
    //   {
    //     type: 'area',
    //     xField: 'semester',
    //     yField: ['total', 'non_a_grade'],
    //     shapeField: 'smooth',
    //     // transform: [{ type: 'groupX', y: 'mean', y1: 'mean' }],
    //     style: { fill: '#85c5A6', fillOpacity: 0.3 },
    //     axis: { y: { title: 'A 人数 / 总人数 (人)', titleFill: '#85C5A6' } },
    //     tooltip: {
    //       items: [
    //         { channel: 'y', valueFormatter: '.1f' },
    //         { channel: 'y1', valueFormatter: '.1f' },
    //       ],
    //     },
    //   },
    //   {
    //     type: 'line',
    //     xField: 'semester',
    //     yField: 'ave_gpa',
    //     shapeField: 'smooth',
    //     // transform: [{ type: 'groupX', y: 'mean' }],
    //     style: { stroke: 'steelblue' },
    //     scale: { y: { nice: false } },
    //     axis: {
    //       y: {
    //         position: 'right',
    //         title: '平均绩点',
    //         titleFill: 'steelblue',
    //       },
    //     },
    //     tooltip: { items: [{ channel: 'y', valueFormatter: '.1f' }] },
    //   },
    // ],
  };

  //   return <DualAxes {...config} />;
  // }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" style={{ marginTop: 60 }}>
        <Stack spacing={2} >
          {course === null ?
            (<>
              <Typography variant="h2" align="center" gutterBottom> OpenGPA </Typography>
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
            </>) : (<></>)}

          <Card>
            {/* <ARateGraph /> */}
            <div style={{ height: 80, paddingTop: 10 }}><AreaChart {...arateConfig} /></div>
            <CardContent>
              <Typography gutterBottom variant="h4" component="div" style={{ fontWeight: 'bold', paddingTop: '10px' }}>{courseName}</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>数据来自 OpenGPA 数据库，仅供参考</Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>数据库更新时间: {updateTime}</Typography>
              <Grid container
                spacing={{ xs: 2, md: 3 }}
                columns={{ xs: 4, sm: 8, md: 12 }}
                padding={1}
                direction="row"
                justifyContent="center"
                alignItems="center"
              >
                <Grid xs={4} sm={6} md={8} item>
                  {/* <TotalGraph /> */}
                  <DualAxes {...totalConfig} />
                </Grid>
                <Grid xs={4} sm={2} md={4} columns={4}
                  direction="column"
                  justifyContent="center"
                  alignItems="center">
                  <Grid xs={4} item>
                    {/* <ARateRecentGraph /> */}
                    <LiquidChart {...arateRecentConfig} />
                  </Grid>
                  <Grid xs={4} item>
                    {/* <PersonaGraph /> */}
                    <PieChart {...personaConfig} />
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>


          <Stack spacing={2}>
            <Typography variant="h6" align="center" gutterBottom>给分趋势</Typography>
            {/* <TrendGraph /> */}
            <ColumnChart {...trendConfig} />
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
    </ThemeProvider>
  );
}

export default App;