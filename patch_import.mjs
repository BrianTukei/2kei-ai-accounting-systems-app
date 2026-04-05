const fs = require('fs');

let fileStr = fs.readFileSync('src/hooks/useBankImport.ts', 'utf8');

const newProcessFile = \
  const processFile = useCallback(async (file: File) => {
    setError(null);
    setStep('processing');
    setProgress(5);

    try {
      if (!file) throw new Error('No file selected');
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

      setProgress(40);

      // Hit our new robust backend parser route directly
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobType', 'bank_statement_parse');

      setProgress(60);

      const res = await fetch('/api/documents/parse-preview', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + (localStorage.getItem('token') || localStorage.getItem('supabase.auth.token') || '')
        },
        body: formData
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to parse document');
      }

      const backendRows = resData.rows || [];
      if (backendRows.length === 0) {
         throw new Error('No valid transaction rows found in file.');
      }

      setProgress(80);

      // Map backend unified structure to frontend ImportedRow wizard view
      const mapped = backendRows.map((r: any) => {
         const debit = r.type === 'expense' ? Math.abs(r.amount) : 0;
         const credit = r.type === 'income' ? Math.abs(r.amount) : 0;
         const isDuplicate = false; // Add duplicate check if needed

         return {
            date: r.date,
            description: r.description,
            debit,
            credit,
            balance: null,
            aiCategory: r.category !== 'Uncategorized' ? r.category : 'Uncategorized',
            aiType: r.type,
            isDuplicate: isDuplicate
         }
      });
      
      const categorised = categoriseBatch(mapped);
      
      const importedRows: ImportedRow[] = categorised.map(r => ({
          ...r,
          id: uuidv4(),
          confirmed: !r.isDuplicate,
      }));

      const newSession: ImportSession = {
        id:        uuidv4(),
        fileName:  file.name,
        fileType:  ext,
        totalRows: importedRows.length,
        rows:      importedRows,
        createdAt: new Date().toISOString(),
      };

      setSession(newSession);
      setRows(importedRows);
      setProgress(100);

      setTimeout(() => setStep('review'), 500);

    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Failed to parse file. Please check the file format and try again.';
      setError(errorMsg);
      setStep('upload');
      setProgress(0);
    }
  }, []);
\;

// Regex block replace
fileStr = fileStr.replace(/const processFile = useCallback\(async \(file: File\) => \{[\s\S]*?\}, \[\]\);/, newProcessFile.trim());

fs.writeFileSync('src/hooks/useBankImport.ts', fileStr);
console.log('Patched');
