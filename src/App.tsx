import { Autocomplete, Button, Container, MenuItem, Select, SelectChangeEvent, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Graph } from './apihandle';
import React, { useEffect, useState } from 'react';
import { Column } from '@ant-design/charts';

function wrapUrl(url: string) {
  const urlprefix = process.env.NODE_ENV !== 'development' ? 'http://localhost:8787' : 'https://api.opengpa.icu';
  return urlprefix + url;
}

function App() {
  const query = new URLSearchParams(window.location.search);
  const course = query.get('course');

  const [courseName, setCourseName] = React.useState(course == null ? '' : course);
  const [allCourse, setAllCourse] = React.useState([] as string[]);
  const [semester, setSemester] = React.useState(null as string | null);
  const [allSemester, setAllSemester] = React.useState([] as string[]);
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

  // get semester on course change
  useEffect(() => {
    fetch(wrapUrl("/api/v1/getSemesterByCourseName"), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "course_name": courseName })
    })
      .then(response => response.json())
      .then(result => {
        result.sort((a: any, b: any) => {
          return a.localeCompare(b);
        });
        return result;
      })
      .then(result => {
        setAllSemester(result)
        setSemester(null)
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
        // forEach(json, (detail, GPA) => {
        //   console.log(GPA, detail)
        //   forEach(detail, (value, id) => {
        //     result.push({ GPA: GPA, id: id, value: value });
        //   });
        // });
        for (let GPA in json) {
          for (let id in json[GPA]) {
            result.push({ GPA: GPA, id: id, value: json[GPA][id] });
          }
        }
        result.sort((a, b) => {
          return a.GPA - b.GPA;
        });
        setData(result);
      })
      .catch((error) => {
        console.log('fetch data failed', error);
      });
  }, [semester, courseName])

  const config = {
    data,
    xField: 'GPA',
    yField: 'value',
    stack: true,
    colorField: 'id',
    label: {
      text: 'value',
      textBaseline: 'bottom',
      position: 'inside',
    },
    // annotations,
  };

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
          onInputChange={(event, newInputValue) => setCourseName(newInputValue)}
        />
        <ToggleButtonGroup
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
        <Typography variant="h4" align="center" gutterBottom>{courseName}</Typography>
        <Typography variant="h6" align="center" gutterBottom>学期: {semester == null ? "所有" : semester}</Typography>

        <Column {...config} />
      </Stack>
    </Container>
  );
}

export default App;