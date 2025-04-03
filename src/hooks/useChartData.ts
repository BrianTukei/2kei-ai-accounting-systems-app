
// Custom hook to prepare chart data for the overview chart
export function useChartData() {
  // Mock data for development
  const mockSignupData = [
    { date: 'Jan', count: 5 },
    { date: 'Feb', count: 12 },
    { date: 'Mar', count: 8 },
    { date: 'Apr', count: 15 },
    { date: 'May', count: 22 },
    { date: 'Jun', count: 18 },
  ];

  // Get real login/signup data from localStorage
  const getUserActivityData = () => {
    const storedSignups = localStorage.getItem('userSignups');
    const loginHistory = localStorage.getItem('loginHistory');
    
    let signups = [];
    let logins = [];
    
    if (storedSignups) {
      signups = JSON.parse(storedSignups);
    }
    
    if (loginHistory) {
      logins = JSON.parse(loginHistory);
    }
    
    return { signups, logins };
  };

  // Format data for the chart
  const getChartData = () => {
    // Group signups by month and map to the format expected by OverviewChart
    const signupsByMonth = mockSignupData.reduce((acc, { date, count }) => {
      return [...acc, { 
        name: date, 
        income: count, // Use 'income' instead of 'signups'
        expenses: Math.floor(count * 0.3) // Use 'expenses' instead of 'target'
      }];
    }, [] as { name: string; income: number; expenses: number }[]);
    
    return signupsByMonth;
  };

  const { signups, logins } = getUserActivityData();

  return {
    chartData: getChartData(),
    rawData: mockSignupData,
    userSignups: signups,
    userLogins: logins
  };
}
