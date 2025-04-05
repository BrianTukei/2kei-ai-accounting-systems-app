
// Custom hook to prepare chart data for the overview chart
export function useChartData() {
  // Empty template data
  const emptyChartData = [
    { name: 'Jan', income: 0, expenses: 0 },
    { name: 'Feb', income: 0, expenses: 0 },
    { name: 'Mar', income: 0, expenses: 0 },
    { name: 'Apr', income: 0, expenses: 0 },
    { name: 'May', income: 0, expenses: 0 },
    { name: 'Jun', income: 0, expenses: 0 },
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

  return {
    chartData: getChartData(),
    saveChartData,
    emptyTemplate: emptyChartData
  };
}
