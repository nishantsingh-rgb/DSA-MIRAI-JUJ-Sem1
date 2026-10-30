#include <iostream>
#include <iomanip>
#include <vector>
using namespace std;

void insertionSort(vector<int> &arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

double median(vector<int> arr) {
    insertionSort(arr);
    int n = arr.size();
    if (n % 2 == 1) {
        return arr[n / 2];                       // odd: the middle one
    }
    return (arr[n / 2 - 1] + arr[n / 2]) / 2.0;  // even: average of the two middles
}

int main() {
    vector<int> odd = {7, 1, 5, 3, 9};
    vector<int> even = {8, 2, 7, 4, 3, 10};
    cout << fixed << setprecision(1);
    cout << "Median of {7, 1, 5, 3, 9}     = " << median(odd) << endl;
    cout << "Median of {8, 2, 7, 4, 3, 10} = " << median(even) << endl;
    return 0;
}
