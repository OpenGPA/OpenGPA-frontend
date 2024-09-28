import { Autocomplete, Backdrop, Button, Card, CardContent, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, Link, MenuItem, Select, SelectChangeEvent, Skeleton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { AreaChart, AreaChartProps, BarChart, BarChartProps, ColumnChart, ColumnChartProps, DualAxesChart, DualAxesChartProps, LiquidChart, LiquidChartProps, PieChart, PieChartProps } from '@opd/g2plot-react';
import DualAxes from '@opd/g2plot-react/lib/plots/dual-axes';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

function wrapUrl(url: string) {
  // const urlprefix = process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : 'https://api.opengpa.icu';
  const urlprefix = "https://api.opengpa.icu";
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

interface Detail {
  credit: string;
  id: string;
  institute: string;
  instructor: string;
  link: string;
  name: string;
  nameEn: string;
}

// Chart Config
const arateConfig: AreaChartProps = {
  data: [],
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
    // {
    //   type: 'regionFilter',
    //   start: ['min', 0.3],
    //   end: ['max', '0'],
    //   color: '#D1D6E0',
    //   animate: false,
    // },
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
          // fill: theme.palette.text.secondary,
          textBaseline: 'bottom',
        },
      },
      style: {
        // stroke: theme.palette.text.secondary,
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


const totalConfig: DualAxesChartProps = {
  data: [],
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
  tooltip: {
    shared: true,
    showCrosshairs: true,
    formatter: (items: any) => {
      if(JSON.stringify(items).includes("type"))
        return {
          name: items.type,
          value: items.value,
        };
      else
        return {
          name: "平均 GPA",
          value: items.ave_gpa.toFixed(2),
      }
    }
  }
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

const trendConfig: ColumnChartProps = {
  data: [],
  height: 400,
  xField: 'semester',
  yField: 'value',
  seriesField: 'gpa',
  isPercent: true,
  isStack: true,
};


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

  // Headless mode if course is specified
  const query = new URLSearchParams(window.location.search);
  const course = query.get('course');

  // Get #

  // urldecode hash
  const hash = course == null ? decodeURIComponent(window.location.hash.substring(1)) : course;

  const [courseName, setCourseName] = React.useState(hash == '' ? '信息科学技术导论' : hash);
  const [allCourse, setAllCourse] = React.useState([] as string[]);
  const [semester, setSemester] = React.useState(null as string | null);
  const [allSemester, setAllSemester] = React.useState([] as string[]);
  const [updateTime, setUpdateTime] = React.useState('');
  const [courseDetail, setCourseDetail] = React.useState({} as Detail);
  const [gpaOverview, setGpaOverview] = React.useState([] as GPAOverview[]);
  const [seriesOverview, setSeriesOverview] = React.useState([] as TypeOverview[]);
  const [totalOverview, setTotalOverview] = React.useState([] as TotalEntry[]);
  const [arateOverview, setArateOverview] = React.useState([] as Overview[]);
  const [backdropOpened, setBackdropOpened] = React.useState(false);
  const [semesterLoading, setSemesterLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
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
    setBackdropOpened(true);
    fetch(wrapUrl("/api/v1/getCourses"))
      .then(response => response.json())
      .then(result => setAllCourse(result))
      .catch(error => console.log('error', error))
      .finally(() => setBackdropOpened(false));
  }, [])

  // get overview on course change
  useEffect(() => {
    setBackdropOpened(true);
    fetch(wrapUrl("/api/v1/getOverviewByCourseName"), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "course_name": courseName })
    })
      .then(response => response.json())
      .then(result => {
        // course detail
        setCourseDetail(result['detail']);

        // gpa overview
        var gparesult = [] as GPAOverview[];
        var gpatemplate = { '4.0': 0, '3.7': 0, '3.3': 0, '3.0': 0, '2.7': 0, '2.3': 0, '2.0': 0, '1.7': 0, '1.3': 0, '1.0': 0, '0.7': 0, '0.0': 0, '未通过': 0 };
        // combine result['gpa'] with gpatemplate
        Object.keys(result['gpa']).forEach((sem) => {
          Object.keys(gpatemplate).forEach((grade) => {
            if (!result['gpa'][sem].hasOwnProperty(grade)) {
              gparesult.push({ semester: sem, gpa: grade, value: 0 });
            } else {
              gparesult.push({ semester: sem, gpa: grade, value: result['gpa'][sem][grade] });
            }
          });
        });

        // console.log(gparesult);

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
            type: '3.7+',
            ave_gpa: sumGPA / total,
          })

          totalresult.push({
            semester: sem,
            // total: total,
            // non_a_grade: total - aGrade,
            value: total - aGrade,
            type: '其他',
            ave_gpa: sumGPA / total,
          })
        })
        setTotalOverview(totalresult);

        const update = new Date(result['update'] * 1000);
        setUpdateTime(update.toLocaleDateString());
      })
      .catch(error => console.log('error', error))
      .finally(() => setBackdropOpened(false));
  }, [courseName])

  // get data on semester / course change
  useEffect(() => {
    setSemesterLoading(true);
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
      })
      .finally(() => setSemesterLoading(false));
  }, [semester, courseName])

  const allInfoConfig: ColumnChartProps = {
    data: [],
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
  
  const arateRecentConfig: LiquidChartProps = {
    percent: 0,
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
        formatter: (data) => '3.7+ 率' + `${data?.percent < 0.1 ? ' 疑似数据不足' : ''}`,
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

  const personaConfig: PieChartProps = {
    data: [],
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={backdropOpened}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
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
                  else {
                    setCourseName(newValue.split(" | ")[0]);
                    window.location.hash = newValue.split(" | ")[0];
                  }
                }}
              />
            </>) : (<></>)}

          <Card>
            {/* <ARateGraph /> */}
            <div style={{ height: 80, paddingTop: 10 }}><AreaChart {...arateConfig} data={arateOverview} /></div>
            <CardContent>
              <Typography variant="h4" component="div" style={{ fontWeight: 'bolder', paddingTop: '10px' }}>{courseName}</Typography>
              <Typography gutterBottom variant="body1" component="div" color="textSecondary">{courseDetail.nameEn}</Typography>
              {courseDetail.id === '' ? (<></>) : (<Typography gutterBottom variant="body1" component="div" color="textSecondary">{courseDetail.id} | {courseDetail.institute} | {courseDetail.instructor} | {courseDetail.credit} 学分</Typography>)}
              {courseDetail.link === '' ? (<></>) : (<Link href={courseDetail.link} target="_blank" rel="noreferrer" color="textSecondary">课程大纲</Link>)}
              <Typography variant="body2" color="textSecondary">数据来自 OpenGPA 数据库，仅供参考</Typography>
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
                  <DualAxes {...totalConfig} data={[totalOverview, totalOverview]} />
                </Grid>
                <Grid xs={4} sm={2} md={4} columns={4}
                  direction="column"
                  justifyContent="center"
                  alignItems="center">
                  <Grid xs={4} item>
                    {/* <ARateRecentGraph /> */}
                    <LiquidChart {...arateRecentConfig} percent={(arateOverview.length > 0 ? arateOverview[arateOverview.length - 1].value : 0)} />
                  </Grid>
                  <Grid xs={4} item>
                    {/* <PersonaGraph /> */}
                    <PieChart {...personaConfig} data={seriesOverview} />
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>


          <Stack spacing={2}>
            <Typography variant="h6" align="center" gutterBottom>给分趋势</Typography>
            {/* <TrendGraph /> */}
            <ColumnChart {...trendConfig} data={gpaOverview} />
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

            <div style={{ height: '650px' }}>
              <ColumnChart {...allInfoConfig} data={data} />
            </div>

            <Typography variant="body2" align="center" color="textSecondary" >
              数据来自 OpenGPA 数据库，仅供参考
              <br />
              数据由同学自发填写提供，OpenGPA 不对数据的准确性负责
              <br />
              提供更多数据，让 OpenGPA 更加完善
            </Typography>

            <Button variant="contained" color="primary" onClick={() => setDialogOpen(true)} style={{ marginBottom: '50px' }}>提供数据</Button>

            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {"提交 GPA / 课程数据"}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  当前时段暂未开放数据提交或已结束，如有需要请联系 admin@opengpa.icu

                  <TextField
                    autoFocus
                    margin="dense"
                    id="class"
                    label="课程名"
                    type="text"
                    fullWidth
                    disabled
                  />
                  <TextField
                    autoFocus
                    margin="dense"
                    id="semester"
                    label="学期"
                    type="text"
                    fullWidth
                    disabled
                  />
                  <TextField
                    autoFocus
                    margin="dense"
                    id="gpa"
                    label="GPA"
                    type="text"
                    fullWidth
                    disabled
                  />
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>取消</Button>
                <Button onClick={() => setDialogOpen(false)} autoFocus disabled>
                  提交
                </Button>
              </DialogActions>
            </Dialog>
          </Stack>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}

export default App;