import { Button, Container, MenuItem, Select, SelectChangeEvent, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Graph } from './apihandle';
import React, { useEffect, useState } from 'react';
import { Column } from '@ant-design/charts';

function App() {
  const [courseName, setCourseName] = React.useState('数学分析II');
  const [allCourse, setAllCourse] = React.useState([] as string[]);
  const [semester, setSemester] = React.useState('');
  const [allSemester, setAllSemester] = React.useState([] as string[]);
  const [data, setData] = useState([] as any[]);

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newSemester: string,
  ) => {
    setSemester(newSemester);
  };

  const ClickEvent = () => {
    fetch("http://localhost:5000/api/v1/getCourses")
      .then(response => response.json())
      .then(result => setAllCourse(result))
      .catch(error => console.log('error', error));
  }

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/getCourses")
      .then(response => response.json())
      .then(result => setAllCourse(result))
      .catch(error => console.log('error', error));
  }, [])

  useEffect(() => {
    fetch("/api/v1/getSemesterByCourseName", {
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
        setSemester('')
      })
      .catch(error => console.log('error', error));
  }, [courseName])

  useEffect(() => {
    fetch("/api/v1/getGPAByCourseName", {
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
  }, [semester])

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
        <Select
          color='primary'
          label="学期"
          value={courseName}
          onChange={(event: SelectChangeEvent) => setCourseName(event.target.value)}
        >
          {allCourse.map((value) => (
            <MenuItem value={value} key={value}>{value}</MenuItem>
          ))}
        </Select>
        <ToggleButtonGroup
          color="primary"
          value={semester}
          exclusive
          onChange={handleChange}
          aria-label="Semester"
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