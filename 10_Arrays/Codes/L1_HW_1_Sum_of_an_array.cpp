#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {4, 9, 1, 7, 3};
    int n = arr.size();
    int sum = 0;

    for (int i = 0; i < n; i++) {
        sum += arr[i];
        cout << "add " << arr[i] << " -> running sum = " << sum << endl;
    }
    cout << "Sum of the array = " << sum << endl;
    return 0;
}
