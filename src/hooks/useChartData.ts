
// Custom hook to prepare chart data for the overview chart
export function useChartData() {
  // Empty template data
  const emptyChartData = [
    { name: 'Month 1', income: 0, expenses: 0 },
    { name: 'Month 2', income: 0, expenses: 0 },
    { name: 'Month 3', income: 0, expenses: 0 },
  ];

  // Get any saved chart data from localStorage
  const getSavedChartData = () => {
    const savedData = localStorage.getItem('userChartData');
    return savedData ? JSON.parse(savedData) : null;
  };

  // Format data for the chart
  const getChartData = () => {
    const savedData = getSavedChartData();
    return savedData || emptyChartData;
  };

  const saveChartData = (data: any[]) => {
    localStorage.setItem('userChartData', JSON.stringify(data));
  };

  // Get user signups from localStorage
  const getUserSignups = () => {
    const signups = localStorage.getItem('userSignups');
    return signups ? JSON.parse(signups) : [];
  };

  // Get user logins from localStorage
  const getUserLogins = () => {
    const logins = localStorage.getItem('userLogins');
    return logins ? JSON.parse(logins) : [];
  };

  return {
    chartData: getChartData(),
    saveChartData,
    emptyTemplate: emptyChartData,
    userSignups: getUserSignups(),
    userLogins: getUserLogins(),
  };
}
