#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {5, 2, 4, 6, 1, 3};
    int n = arr.size();
    int totalShifts = 0;

    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        int shifts = 0;
        cout << "key = " << key << ":";
        while (j >= 0 && arr[j] > key) {
            cout << " shift " << arr[j];
            arr[j + 1] = arr[j];
            j--;
            shifts++;
        }
        arr[j + 1] = key;
        totalShifts += shifts;
        if (shifts == 0) {
            cout << " no shift";
        }
        cout << "  -> placed at index " << j + 1 << endl;
    }

    cout << "Sorted: ";
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
    cout << "Total shifts = " << totalShifts << endl;
    return 0;
}
